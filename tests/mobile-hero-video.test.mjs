import assert from 'node:assert/strict';
import test from 'node:test';
import { createMobileHeroVideoController } from '../src/lib/mobile-hero-video.mjs';

const wait = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const waitFor = async (predicate, timeoutMilliseconds = 100) => {
  const deadline = Date.now() + timeoutMilliseconds;
  while (!predicate()) {
    if (Date.now() >= deadline) {
      throw new Error('Timed out waiting for the expected controller state.');
    }
    await wait(2);
  }
};

class FakeMediaQuery extends EventTarget {
  constructor(matches) {
    super();
    this.matches = matches;
  }
}

class FakeSource {
  constructor(src) {
    this.attributes = new Map([['src', src]]);
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }

  setAttribute(name, value) {
    this.attributes.set(name, value);
  }
}

class FakeVideo extends EventTarget {
  constructor(playOutcomes = [null]) {
    super();
    this.attributes = new Map();
    this.currentTime = 0;
    this.defaultMuted = false;
    this.duration = 10.03;
    this.error = null;
    this.frameCallback = null;
    this.loadCalls = 0;
    this.loop = true;
    this.muted = false;
    this.paused = true;
    this.playCalls = 0;
    this.playOutcomes = playOutcomes;
    this.playsInline = false;
    this.readyState = 2;
    this.sources = [
      new FakeSource('/videos/hero/mobile-jerusalem-v1.mp4'),
      new FakeSource('/videos/hero/mobile-jerusalem-v1.webm'),
    ];
  }

  load() {
    this.loadCalls += 1;
    this.paused = true;
  }

  pause() {
    this.paused = true;
  }

  play() {
    const outcome = this.playOutcomes[this.playCalls] ?? null;
    this.playCalls += 1;
    if (outcome instanceof Error) return Promise.reject(outcome);
    if (outcome && typeof outcome.then === 'function') return outcome;
    this.paused = false;
    return Promise.resolve();
  }

  querySelectorAll(selector) {
    return selector === 'source' ? this.sources : [];
  }

  requestVideoFrameCallback(callback) {
    this.frameCallback = callback;
    return 1;
  }

  setAttribute(name, value) {
    this.attributes.set(name, value);
  }
}

const createHarness = ({
  IntersectionObserverCtor = null,
  playOutcomes,
  reducedMotion = false,
  timings = {},
} = {}) => {
  const documentRef = new EventTarget();
  documentRef.hidden = false;
  const windowRef = new EventTarget();
  const mobileQuery = new FakeMediaQuery(true);
  const reducedMotionQuery = new FakeMediaQuery(reducedMotion);
  windowRef.clearTimeout = clearTimeout;
  windowRef.matchMedia = (query) =>
    query.includes('prefers-reduced-motion')
      ? reducedMotionQuery
      : mobileQuery;
  windowRef.requestAnimationFrame = (callback) => setTimeout(callback, 0);
  windowRef.setTimeout = setTimeout;
  const root = { dataset: {} };
  const video = new FakeVideo(playOutcomes);
  const controller = createMobileHeroVideoController({
    documentRef,
    IntersectionObserverCtor,
    root,
    timings,
    video,
    windowRef,
  });

  return {
    controller,
    documentRef,
    reducedMotionQuery,
    root,
    video,
    windowRef,
  };
};

test('autoplays muted and reveals only after a presented frame', async () => {
  const harness = createHarness({
    timings: { progressCheckDelay: 50 },
  });
  harness.controller.start();
  await wait(0);

  assert.equal(harness.video.playCalls, 1);
  assert.equal(harness.video.muted, true);
  assert.equal(harness.video.defaultMuted, true);
  assert.equal(harness.video.playsInline, true);
  assert.equal(harness.root.dataset.heroVideoState, 'fallback');

  harness.video.currentTime = 0.2;
  harness.video.dispatchEvent(new Event('timeupdate'));
  harness.video.frameCallback();
  assert.equal(harness.root.dataset.heroVideoState, 'playing');

  harness.controller.destroy();
});

test('retries a transient play rejection', async () => {
  const harness = createHarness({
    playOutcomes: [new Error('transient autoplay rejection'), null],
    timings: {
      playRetryDelays: [0],
      progressCheckDelay: 50,
    },
  });
  harness.controller.start();
  await wait(10);

  assert.equal(harness.video.playCalls, 2);
  assert.equal(harness.video.loadCalls, 0);

  harness.controller.destroy();
});

test('rebuilds the media pipeline when play resolves without progress', async () => {
  const harness = createHarness({
    timings: {
      maxRecoveries: 1,
      progressCheckDelay: 5,
      recoveryDelays: [0],
    },
  });
  harness.controller.start();
  await wait(25);

  assert.equal(harness.video.loadCalls, 1);
  assert.match(
    harness.video.sources[0].getAttribute('src'),
    /\?recovery=1$/,
  );
  assert.equal(harness.root.dataset.heroVideoState, 'failed');

  harness.controller.destroy();
});

test('covers and recovers after a stall', async () => {
  const harness = createHarness({
    timings: {
      progressCheckDelay: 100,
      recoveryDelays: [0],
      stallRecoveryDelay: 5,
    },
  });
  harness.controller.start();
  await wait(0);
  harness.video.dispatchEvent(new Event('waiting'));
  assert.equal(harness.root.dataset.heroVideoState, 'recovering');
  await wait(10);
  assert.equal(harness.video.loadCalls, 1);

  harness.controller.destroy();
});

test('rebuilds on BFCache restoration and remains covered during recovery', async () => {
  const harness = createHarness({
    timings: {
      progressCheckDelay: 100,
      recoveryDelays: [0],
    },
  });
  harness.controller.start();
  await wait(0);
  harness.windowRef.dispatchEvent(new Event('pagehide'));
  assert.equal(harness.root.dataset.heroVideoState, 'fallback');

  const pageShow = new Event('pageshow');
  Object.defineProperty(pageShow, 'persisted', { value: true });
  harness.windowRef.dispatchEvent(pageShow);
  await wait(5);
  assert.equal(harness.video.loadCalls, 1);

  harness.controller.destroy();
});

test('pauses while hidden and retries when the browser becomes visible', async () => {
  const harness = createHarness({
    timings: { progressCheckDelay: 100 },
  });
  harness.controller.start();
  await wait(0);
  assert.equal(harness.video.playCalls, 1);

  harness.documentRef.hidden = true;
  harness.documentRef.dispatchEvent(new Event('visibilitychange'));
  assert.equal(harness.video.paused, true);
  assert.equal(harness.root.dataset.heroVideoState, 'fallback');

  harness.documentRef.hidden = false;
  harness.documentRef.dispatchEvent(new Event('visibilitychange'));
  await wait(0);
  assert.equal(harness.video.playCalls, 2);

  harness.controller.destroy();
});

test('rebuilds an errored Safari media pipeline with a recovery URL', async () => {
  const harness = createHarness({
    timings: {
      progressCheckDelay: 100,
      recoveryDelays: [0],
    },
  });
  harness.controller.start();
  await wait(0);

  harness.video.error = { code: 3 };
  harness.video.dispatchEvent(new Event('error'));
  await wait(5);
  assert.equal(harness.video.loadCalls, 1);
  assert.match(
    harness.video.sources[0].getAttribute('src'),
    /\?recovery=1$/,
  );
  assert.notEqual(harness.root.dataset.heroVideoState, 'playing');

  harness.controller.destroy();
});

test('does not autoplay when reduced motion is requested', async () => {
  const harness = createHarness({ reducedMotion: true });
  harness.controller.start();
  await wait(0);

  assert.equal(harness.video.playCalls, 0);
  assert.equal(harness.root.dataset.heroVideoState, 'fallback');

  harness.controller.destroy();
});

test('treats a normal loop wrap as forward progress', async () => {
  const harness = createHarness({
    timings: {
      progressCheckDelay: 10,
      recoveryDelays: [0],
    },
  });
  harness.video.currentTime = 9.98;
  harness.controller.start();
  await wait(0);
  harness.video.currentTime = 0.12;
  await wait(12);

  assert.equal(harness.video.loadCalls, 0);

  harness.controller.destroy();
});

test('keeps monitoring after initial progress and recovers a later silent freeze', async () => {
  const harness = createHarness({
    timings: {
      maxRecoveries: 1,
      progressCheckDelay: 6,
      recoveryDelays: [0],
    },
  });
  harness.controller.start();
  await wait(0);
  harness.video.currentTime = 0.2;
  await wait(9);
  assert.equal(harness.video.loadCalls, 0);
  await wait(9);
  assert.equal(harness.video.loadCalls, 1);

  harness.controller.destroy();
});

test('cancels scheduled stall recovery when playback resumes', async () => {
  const harness = createHarness({
    timings: {
      progressCheckDelay: 100,
      recoveryDelays: [0],
      stallRecoveryDelay: 6,
    },
  });
  harness.controller.start();
  await wait(0);
  harness.video.dispatchEvent(new Event('waiting'));
  harness.video.dispatchEvent(new Event('playing'));
  await wait(10);

  assert.equal(harness.video.loadCalls, 0);

  harness.controller.destroy();
});

test('coalesces rapid media failures into one pipeline recovery', async () => {
  const harness = createHarness({
    timings: {
      progressCheckDelay: 100,
      recoveryDelays: [20],
    },
  });
  harness.controller.start();
  await wait(0);
  harness.video.dispatchEvent(new Event('error'));
  harness.video.dispatchEvent(new Event('stalled'));
  harness.video.dispatchEvent(new Event('error'));
  await wait(5);

  assert.equal(harness.video.loadCalls, 1);
  assert.equal(harness.controller.getState().recoveryInFlight, true);

  harness.controller.destroy();
});

test('recovers when a play promise never settles', async () => {
  const neverSettles = new Promise(() => {});
  const harness = createHarness({
    playOutcomes: [neverSettles, null],
    timings: {
      maxRecoveries: 1,
      playAttemptTimeout: 5,
      progressCheckDelay: 100,
      recoveryDelays: [0],
    },
  });
  harness.controller.start();
  await wait(12);

  assert.equal(harness.video.loadCalls, 1);
  assert.ok(harness.video.playCalls >= 2);

  harness.controller.destroy();
});

test('starts a fresh bounded recovery episode on each BFCache return', async () => {
  const harness = createHarness({
    timings: {
      maxRecoveries: 1,
      progressCheckDelay: 100,
      recoveryDelays: [0],
    },
  });
  harness.controller.start();
  await wait(0);

  const restoreFromBFCache = async () => {
    harness.windowRef.dispatchEvent(new Event('pagehide'));
    const pageShow = new Event('pageshow');
    Object.defineProperty(pageShow, 'persisted', { value: true });
    harness.windowRef.dispatchEvent(pageShow);
    await wait(3);
  };

  await restoreFromBFCache();
  assert.equal(harness.video.loadCalls, 1);
  await restoreFromBFCache();
  assert.equal(harness.video.loadCalls, 2);
  assert.notEqual(harness.root.dataset.heroVideoState, 'failed');

  harness.controller.destroy();
});

test('brief progress cannot bypass the bounded recovery budget', async () => {
  const harness = createHarness({
    timings: {
      healthyRecoveryResetDelay: 50,
      maxRecoveries: 1,
      progressCheckDelay: 100,
      recoveryDelays: [0],
      stallRecoveryDelay: 3,
    },
  });
  harness.controller.start();
  await wait(0);
  harness.video.dispatchEvent(new Event('stalled'));
  await waitFor(
    () =>
      harness.video.loadCalls === 1 &&
      !harness.controller.getState().recoveryInFlight,
  );
  assert.equal(harness.video.loadCalls, 1);

  harness.video.currentTime = 0.1;
  harness.video.dispatchEvent(new Event('timeupdate'));
  harness.video.currentTime = 0.2;
  harness.video.dispatchEvent(new Event('timeupdate'));
  harness.video.dispatchEvent(new Event('stalled'));
  await waitFor(() => harness.root.dataset.heroVideoState === 'failed');

  assert.equal(harness.video.loadCalls, 1);
  assert.equal(harness.root.dataset.heroVideoState, 'failed');

  harness.controller.destroy();
});

test('uses the double-animation-frame fallback before revealing video', async () => {
  const harness = createHarness({
    timings: { progressCheckDelay: 100 },
  });
  harness.video.requestVideoFrameCallback = undefined;
  harness.controller.start();
  await wait(0);
  harness.video.currentTime = 0.2;
  harness.video.dispatchEvent(new Event('timeupdate'));
  assert.equal(harness.root.dataset.heroVideoState, 'fallback');
  await wait(5);
  assert.equal(harness.root.dataset.heroVideoState, 'playing');

  harness.controller.destroy();
});

test('pauses for dynamic reduced motion and resumes only when disabled', async () => {
  const harness = createHarness({
    timings: { progressCheckDelay: 100 },
  });
  harness.controller.start();
  await wait(0);
  assert.equal(harness.video.playCalls, 1);

  harness.reducedMotionQuery.matches = true;
  harness.reducedMotionQuery.dispatchEvent(new Event('change'));
  assert.equal(harness.video.paused, true);
  assert.equal(harness.root.dataset.heroVideoState, 'fallback');

  harness.reducedMotionQuery.matches = false;
  harness.reducedMotionQuery.dispatchEvent(new Event('change'));
  await wait(0);
  assert.equal(harness.video.playCalls, 2);

  harness.controller.destroy();
});

test('pauses offscreen and resumes after re-entering the viewport', async () => {
  let observerCallback;
  class FakeIntersectionObserver {
    constructor(callback) {
      observerCallback = callback;
    }

    disconnect() {}

    observe() {}
  }

  const harness = createHarness({
    IntersectionObserverCtor: FakeIntersectionObserver,
    timings: { progressCheckDelay: 100 },
  });
  harness.controller.start();
  await wait(0);

  observerCallback([
    {
      intersectionRatio: 0,
      isIntersecting: false,
      target: harness.root,
    },
  ]);
  assert.equal(harness.video.paused, true);
  assert.equal(harness.root.dataset.heroVideoState, 'fallback');

  observerCallback([
    {
      intersectionRatio: 1,
      isIntersecting: true,
      target: harness.root,
    },
  ]);
  await wait(0);
  assert.equal(harness.video.playCalls, 2);

  harness.controller.destroy();
});
