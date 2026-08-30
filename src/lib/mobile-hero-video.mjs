const MOBILE_QUERY = "(max-width: 760px)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const DEFAULT_TIMINGS = {
	framePresentationTimeout: 600,
	healthyRecoveryResetDelay: 8000,
	maxRecoveries: 3,
	minProgressSeconds: 0.05,
	playAttemptTimeout: 2500,
	playRetryDelays: [0, 250, 800],
	progressCheckDelay: 1600,
	recoveryDelays: [80, 350, 900],
	startupPlayAttemptTimeout: 6000,
	startupStallRecoveryDelay: 4000,
	stallRecoveryDelay: 700,
};

const mountedControllers = new Map();

const addMediaQueryListener = (query, listener) => {
	if (typeof query.addEventListener === "function") {
		query.addEventListener("change", listener);
		return () => query.removeEventListener("change", listener);
	}

	query.addListener?.(listener);
	return () => query.removeListener?.(listener);
};

export const createMobileHeroVideoController = ({
	documentRef = globalThis.document,
	IntersectionObserverCtor,
	root,
	timings = {},
	video,
	windowRef = globalThis.window,
}) => {
	const config = {
		...DEFAULT_TIMINGS,
		...timings,
		playRetryDelays: timings.playRetryDelays ?? DEFAULT_TIMINGS.playRetryDelays,
		recoveryDelays: timings.recoveryDelays ?? DEFAULT_TIMINGS.recoveryDelays,
	};
	const mobileQuery = windowRef.matchMedia(MOBILE_QUERY);
	const reducedMotionQuery = windowRef.matchMedia(REDUCED_MOTION_QUERY);
	const observerCtor =
		IntersectionObserverCtor === undefined
			? windowRef.IntersectionObserver
			: IntersectionObserverCtor;
	const sourceRecords = [...video.querySelectorAll("source")].map((source) => ({
		source,
		url: source.getAttribute("src") || "",
	}));
	const cleanups = [];

	let attemptToken = 0;
	let consecutiveRecoveries = 0;
	let destroyed = false;
	let hasPresentedFrame = false;
	let healthyTimer = null;
	let inViewport = true;
	let lastMediaTime = 0;
	let presentationPendingToken = null;
	let presentationTimer = null;
	let playInFlight = false;
	let playRetryCount = 0;
	let playTimer = null;
	let progressTimer = null;
	let recoveryInFlight = false;
	let recoverySequence = 0;
	let retryTimer = null;
	let stallTimer = null;
	let wasSuspended = false;

	const setState = (state) => {
		root.dataset.heroVideoState = state;
	};

	const clearTimer = (timer) => {
		if (timer !== null) windowRef.clearTimeout(timer);
	};

	const clearPlaybackTimers = () => {
		clearTimer(healthyTimer);
		clearTimer(playTimer);
		clearTimer(presentationTimer);
		clearTimer(progressTimer);
		clearTimer(retryTimer);
		clearTimer(stallTimer);
		healthyTimer = null;
		playTimer = null;
		presentationPendingToken = null;
		presentationTimer = null;
		progressTimer = null;
		retryTimer = null;
		stallTimer = null;
	};

	const shouldPlay = () =>
		mobileQuery.matches &&
		!reducedMotionQuery.matches &&
		!documentRef.hidden &&
		inViewport;

	const prepareForAutoplay = () => {
		video.muted = true;
		video.defaultMuted = true;
		video.playsInline = true;
		video.setAttribute("muted", "");
		video.setAttribute("playsinline", "");
		video.setAttribute("webkit-playsinline", "");
	};

	const coverVideo = (state = "fallback") => {
		setState(state);
	};

	const currentTime = () =>
		Number.isFinite(video.currentTime) ? video.currentTime : 0;

	const progressBetween = (startedAt, endedAt) => {
		if (endedAt >= startedAt) return endedAt - startedAt;

		const duration = Number.isFinite(video.duration) ? video.duration : 0;
		if (
			video.loop &&
			duration > 0 &&
			startedAt > duration / 2 &&
			endedAt < duration / 2
		) {
			return duration - startedAt + endedAt;
		}

		return 0;
	};

	const recordHealthyProgress = () => {
		if (consecutiveRecoveries === 0 || healthyTimer !== null) return;
		healthyTimer = windowRef.setTimeout(() => {
			healthyTimer = null;
			if (!destroyed && shouldPlay() && !video.paused) {
				consecutiveRecoveries = 0;
			}
		}, config.healthyRecoveryResetDelay);
	};

	const beginRecoveryEpisode = () => {
		clearTimer(healthyTimer);
		healthyTimer = null;
		consecutiveRecoveries = 0;
	};

	const revealPresentedFrame = () => {
		if (!shouldPlay() || video.paused || video.readyState < 2) return;
		const frameToken = attemptToken;
		if (presentationPendingToken === frameToken) return;
		presentationPendingToken = frameToken;
		const requestedAt = currentTime();

		const reveal = () => {
			if (
				!destroyed &&
				frameToken === attemptToken &&
				shouldPlay() &&
				!video.paused &&
				video.readyState >= 2
			) {
				hasPresentedFrame = true;
				presentationPendingToken = null;
				clearTimer(presentationTimer);
				presentationTimer = null;
				setState("playing");
			}
		};

		const revealAfterPaint = () => {
			windowRef.requestAnimationFrame(() => {
				windowRef.requestAnimationFrame(reveal);
			});
		};

		presentationTimer = windowRef.setTimeout(() => {
			presentationTimer = null;
			if (
				frameToken === attemptToken &&
				progressBetween(requestedAt, currentTime()) >= config.minProgressSeconds
			) {
				revealAfterPaint();
			} else if (presentationPendingToken === frameToken) {
				presentationPendingToken = null;
			}
		}, config.framePresentationTimeout);

		if (typeof video.requestVideoFrameCallback === "function") {
			video.requestVideoFrameCallback(revealAfterPaint);
			return;
		}

		revealAfterPaint();
	};

	const withRecoveryQuery = (url, attempt) => {
		const separator = url.includes("?") ? "&" : "?";
		return `${url}${separator}recovery=${attempt}`;
	};

	let attemptPlayback;

	const recoverPipeline = () => {
		if (destroyed || !shouldPlay() || recoveryInFlight) return;

		recoveryInFlight = true;
		clearPlaybackTimers();
		coverVideo("recovering");
		attemptToken += 1;
		playInFlight = false;

		if (consecutiveRecoveries >= config.maxRecoveries) {
			recoveryInFlight = false;
			coverVideo("failed");
			return;
		}

		consecutiveRecoveries += 1;
		recoverySequence += 1;
		hasPresentedFrame = false;
		presentationPendingToken = null;
		video.pause();
		for (const { source, url } of sourceRecords) {
			source.setAttribute("src", withRecoveryQuery(url, recoverySequence));
		}
		video.load();
		lastMediaTime = currentTime();

		const delay =
			config.recoveryDelays[
				Math.min(consecutiveRecoveries - 1, config.recoveryDelays.length - 1)
			] ?? 0;
		retryTimer = windowRef.setTimeout(() => {
			retryTimer = null;
			recoveryInFlight = false;
			playRetryCount = 0;
			void attemptPlayback();
		}, delay);
	};

	const scheduleProgressCheck = (startedAt, token) => {
		clearTimer(progressTimer);
		progressTimer = windowRef.setTimeout(() => {
			progressTimer = null;
			if (destroyed || token !== attemptToken || !shouldPlay()) return;

			const advancedBy = progressBetween(startedAt, currentTime());
			if (!video.paused && advancedBy >= config.minProgressSeconds) {
				playRetryCount = 0;
				recordHealthyProgress();
				revealPresentedFrame();
				scheduleProgressCheck(currentTime(), token);
				return;
			}

			recoverPipeline();
		}, config.progressCheckDelay);
	};

	const schedulePlayRetry = () => {
		if (playRetryCount >= config.playRetryDelays.length) {
			recoverPipeline();
			return;
		}

		const delay = config.playRetryDelays[playRetryCount];
		playRetryCount += 1;
		retryTimer = windowRef.setTimeout(() => {
			retryTimer = null;
			void attemptPlayback();
		}, delay);
	};

	attemptPlayback = async () => {
		if (destroyed || playInFlight || recoveryInFlight || !shouldPlay()) return;

		clearTimer(retryTimer);
		retryTimer = null;
		prepareForAutoplay();
		playInFlight = true;
		const token = ++attemptToken;
		const startedAt = currentTime();
		const attemptTimeout = hasPresentedFrame
			? config.playAttemptTimeout
			: config.startupPlayAttemptTimeout;
		playTimer = windowRef.setTimeout(() => {
			if (destroyed || token !== attemptToken || !shouldPlay()) return;
			playTimer = null;
			playInFlight = false;
			coverVideo();
			if (!hasPresentedFrame && !video.error && video.readyState < 2) {
				attemptToken += 1;
				schedulePlayRetry();
			} else {
				recoverPipeline();
			}
		}, attemptTimeout);

		try {
			await video.play();
			if (destroyed || token !== attemptToken || !shouldPlay()) return;
			clearTimer(playTimer);
			playTimer = null;
			revealPresentedFrame();
			scheduleProgressCheck(startedAt, token);
		} catch {
			if (destroyed || token !== attemptToken || !shouldPlay()) return;
			clearTimer(playTimer);
			playTimer = null;
			coverVideo();
			schedulePlayRetry();
		} finally {
			if (token === attemptToken) playInFlight = false;
		}
	};

	const pauseAndCover = () => {
		clearPlaybackTimers();
		attemptToken += 1;
		playInFlight = false;
		recoveryInFlight = false;
		coverVideo();
		video.pause();
	};

	const resetToPosterFrame = () => {
		if (video.readyState < 1 || !Number.isFinite(video.duration)) return;
		try {
			video.currentTime = 0;
			lastMediaTime = 0;
		} catch {
			// Safari can temporarily reject seeks while restoring a media element.
		}
	};

	const resumeAfterSuspension = () => {
		coverVideo();
		if (!shouldPlay()) return;
		beginRecoveryEpisode();
		if (video.error) {
			recoverPipeline();
			return;
		}
		if (wasSuspended) resetToPosterFrame();
		wasSuspended = false;
		void attemptPlayback();
	};

	const onProgress = () => {
		const nextTime = currentTime();
		if (progressBetween(lastMediaTime, nextTime) < config.minProgressSeconds) {
			return;
		}

		lastMediaTime = nextTime;
		recordHealthyProgress();
		clearTimer(stallTimer);
		stallTimer = null;
		playRetryCount = 0;
		if (root.dataset.heroVideoState !== "playing") revealPresentedFrame();
	};

	const onStall = () => {
		if (!shouldPlay()) return;
		clearTimer(healthyTimer);
		healthyTimer = null;
		if (recoveryInFlight) return;
		clearTimer(stallTimer);
		const recoveryDelay = hasPresentedFrame
			? config.stallRecoveryDelay
			: config.startupStallRecoveryDelay;
		stallTimer = windowRef.setTimeout(() => {
			stallTimer = null;
			coverVideo("recovering");
			recoverPipeline();
		}, recoveryDelay);
	};

	const onError = () => {
		if (!shouldPlay()) return;
		coverVideo("recovering");
		recoverPipeline();
	};

	const onCanPlay = () => {
		if (shouldPlay() && video.paused) void attemptPlayback();
	};

	const onPlaying = () => {
		if (!shouldPlay() || video.paused) return;
		clearTimer(stallTimer);
		stallTimer = null;
		revealPresentedFrame();
		if (progressTimer === null) {
			scheduleProgressCheck(currentTime(), attemptToken);
		}
	};

	const onVisibilityChange = () => {
		if (documentRef.hidden) {
			wasSuspended = true;
			pauseAndCover();
			return;
		}

		resumeAfterSuspension();
	};

	const onPageHide = () => {
		wasSuspended = true;
		pauseAndCover();
	};

	const onPageShow = (event) => {
		if (event.persisted || wasSuspended || video.error) {
			resumeAfterSuspension();
		} else if (shouldPlay() && video.paused) {
			void attemptPlayback();
		}
	};

	const reconcilePlayback = () => {
		if (shouldPlay()) {
			if (root.dataset.heroVideoState !== "playing") coverVideo();
			void attemptPlayback();
			return;
		}
		pauseAndCover();
	};

	const addListener = (target, eventName, listener) => {
		target.addEventListener(eventName, listener);
		cleanups.push(() => target.removeEventListener(eventName, listener));
	};

	const start = () => {
		hasPresentedFrame = root.dataset.heroVideoState === "playing";
		if (!hasPresentedFrame) coverVideo();
		prepareForAutoplay();
		lastMediaTime = currentTime();

		addListener(video, "canplay", onCanPlay);
		addListener(video, "error", onError);
		addListener(video, "loadeddata", onCanPlay);
		addListener(video, "playing", onPlaying);
		addListener(video, "stalled", onStall);
		addListener(video, "timeupdate", onProgress);
		addListener(video, "waiting", onStall);
		addListener(documentRef, "visibilitychange", onVisibilityChange);
		addListener(windowRef, "pagehide", onPageHide);
		addListener(windowRef, "pageshow", onPageShow);
		cleanups.push(addMediaQueryListener(mobileQuery, reconcilePlayback));
		cleanups.push(addMediaQueryListener(reducedMotionQuery, reconcilePlayback));

		if (typeof observerCtor === "function") {
			const observer = new observerCtor(
				(entries) => {
					const entry = entries.find((candidate) => candidate.target === root);
					if (!entry) return;
					inViewport = entry.isIntersecting && entry.intersectionRatio > 0;
					reconcilePlayback();
				},
				{ threshold: 0.05 },
			);
			observer.observe(root);
			cleanups.push(() => observer.disconnect());
		}

		if (shouldPlay()) void attemptPlayback();
		else video.pause();
	};

	const destroy = () => {
		if (destroyed) return;
		destroyed = true;
		pauseAndCover();
		for (const cleanup of cleanups.splice(0)) cleanup();
	};

	return {
		destroy,
		getState: () => ({
			consecutiveRecoveries,
			playRetryCount,
			recoveryInFlight,
			recoverySequence,
			state: root.dataset.heroVideoState,
		}),
		start,
	};
};

export const mountMobileHeroVideos = (documentRef = document) => {
	for (const root of documentRef.querySelectorAll("[data-mobile-hero-video]")) {
		if (mountedControllers.has(root)) continue;
		const video = root.querySelector("video");
		if (!(video instanceof HTMLVideoElement)) continue;

		const controller = createMobileHeroVideoController({ root, video });
		mountedControllers.set(root, controller);
		controller.start();
	}
};

export const destroyMobileHeroVideos = () => {
	for (const controller of mountedControllers.values()) controller.destroy();
	mountedControllers.clear();
};
