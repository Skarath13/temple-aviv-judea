import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import { navigationScrollScript } from "../src/lib/navigation-scroll.mjs";

const globalCss = await readFile(
	new URL("../src/styles/global.css", import.meta.url),
	"utf8",
);
const baseLayout = await readFile(
	new URL("../src/layouts/BaseLayout.astro", import.meta.url),
	"utf8",
);

const createEventTarget = () => {
	const listeners = new Map();

	return {
		addEventListener(type, listener, options = {}) {
			const entries = listeners.get(type) ?? [];
			entries.push({ listener, once: Boolean(options.once) });
			listeners.set(type, entries);
		},
		dispatch(type, event = {}) {
			const entries = listeners.get(type) ?? [];
			for (const entry of [...entries]) {
				entry.listener(event);
				if (entry.once) {
					listeners.set(
						type,
						(listeners.get(type) ?? []).filter((value) => value !== entry),
					);
				}
			}
		},
	};
};

const createHarness = ({
	hash = "",
	iframe = false,
	legacyNavigationType,
	navigationType = "navigate",
	restoration = "auto",
	supportsRestoration = true,
} = {}) => {
	const animationFrames = [];
	const documentEvents = createEventTarget();
	const windowEvents = createEventTarget();
	const documentElement = { scrollTop: 32 };
	const history = supportsRestoration ? { scrollRestoration: restoration } : {};
	const scrollCalls = [];
	const document = {
		...documentEvents,
		body: null,
		documentElement,
	};
	const performance = {
		getEntriesByType: () =>
			navigationType === null ? [] : [{ type: navigationType }],
		...(legacyNavigationType === undefined
			? {}
			: { navigation: { type: legacyNavigationType } }),
	};
	const window = {
		...windowEvents,
		document,
		history,
		location: { hash },
		performance,
		requestAnimationFrame(callback) {
			animationFrames.push(callback);
			return animationFrames.length;
		},
		scrollTo(left, top) {
			scrollCalls.push([left, top]);
			document.documentElement.scrollTop = top;
			if (document.body) document.body.scrollTop = top;
		},
	};
	window.parent = iframe ? {} : window;

	vm.runInNewContext(navigationScrollScript, { document, window });

	return {
		animationFrames,
		document,
		documentEvents,
		history,
		runNextFrame() {
			const callback = animationFrames.shift();
			assert.ok(callback, "expected a queued animation frame");
			callback();
		},
		scrollCalls,
		windowEvents,
	};
};

test("browser-driven document navigation scrolls without a partial smooth state", () => {
	const rootRule = globalCss.match(/html\s*\{(?<declarations>[^}]*)\}/);

	assert.ok(rootRule, "expected a root html style rule");
	assert.match(rootRule.groups.declarations, /\bscroll-behavior:\s*auto\s*;/);
	assert.doesNotMatch(
		rootRule.groups.declarations,
		/\bscroll-behavior:\s*smooth\s*;/,
	);
});

test("the scroll-restoration guard is the first executable head script", () => {
	assert.match(
		baseLayout,
		/import \{ navigationScrollScript \} from '\.\.\/lib\/navigation-scroll\.mjs';/,
	);

	const viewportIndex = baseLayout.indexOf('<meta name="viewport"');
	const guardIndex = baseLayout.indexOf(
		"<script is:inline set:html={navigationScrollScript} />",
	);
	const motionSetupIndex = baseLayout.indexOf("<script is:inline>", guardIndex);

	assert.ok(viewportIndex >= 0, "expected the viewport metadata");
	assert.ok(
		guardIndex > viewportIndex,
		"expected the guard after viewport metadata",
	);
	assert.ok(
		motionSetupIndex > guardIndex,
		"expected the restoration guard before other executable scripts",
	);
});

test("fresh no-fragment loads defeat late restored offsets and return history to auto", () => {
	const harness = createHarness();

	assert.equal(harness.history.scrollRestoration, "manual");
	assert.equal(harness.document.documentElement.scrollTop, 0);

	harness.document.body = { scrollTop: 28 };
	harness.document.documentElement.scrollTop = 28;
	harness.documentEvents.dispatch("DOMContentLoaded");
	assert.equal(harness.document.documentElement.scrollTop, 0);
	assert.equal(harness.document.body.scrollTop, 0);

	harness.document.documentElement.scrollTop = 24;
	harness.document.body.scrollTop = 24;
	harness.windowEvents.dispatch("pageshow", { persisted: false });
	assert.equal(harness.document.documentElement.scrollTop, 0);

	harness.document.documentElement.scrollTop = 18;
	harness.document.body.scrollTop = 18;
	harness.runNextFrame();
	assert.equal(harness.document.documentElement.scrollTop, 0);

	harness.document.documentElement.scrollTop = 14;
	harness.document.body.scrollTop = 14;
	harness.runNextFrame();
	assert.equal(harness.document.documentElement.scrollTop, 0);
	assert.equal(harness.document.body.scrollTop, 0);
	assert.equal(harness.history.scrollRestoration, "auto");
	assert.equal(harness.scrollCalls.length, 5);
});

test("reloads preserve browser-owned pull-to-refresh positioning", () => {
	const harness = createHarness({ navigationType: "reload" });
	const legacyHarness = createHarness({
		legacyNavigationType: 1,
		navigationType: null,
	});

	for (const reloadHarness of [harness, legacyHarness]) {
		assert.equal(reloadHarness.history.scrollRestoration, "auto");
		assert.equal(reloadHarness.scrollCalls.length, 0);
		assert.equal(reloadHarness.animationFrames.length, 0);
	}
});

test("fragment and back-forward navigations retain browser-owned positioning", () => {
	const hashHarness = createHarness({ hash: "#prayer" });
	assert.equal(hashHarness.scrollCalls.length, 0);
	assert.equal(hashHarness.history.scrollRestoration, "auto");

	const historyHarness = createHarness({ navigationType: "back_forward" });
	assert.equal(historyHarness.scrollCalls.length, 0);
	assert.equal(historyHarness.history.scrollRestoration, "auto");

	const legacyHarness = createHarness({
		legacyNavigationType: 2,
		navigationType: null,
	});
	assert.equal(legacyHarness.scrollCalls.length, 0);
	assert.equal(legacyHarness.history.scrollRestoration, "auto");
});

test("the guard leaves Tina preview iframes and existing manual policies alone", () => {
	const iframeHarness = createHarness({ iframe: true });
	assert.equal(iframeHarness.scrollCalls.length, 0);
	assert.equal(iframeHarness.history.scrollRestoration, "auto");

	const manualHarness = createHarness({ restoration: "manual" });
	manualHarness.windowEvents.dispatch("pageshow", { persisted: false });
	manualHarness.runNextFrame();
	manualHarness.runNextFrame();
	assert.equal(manualHarness.history.scrollRestoration, "manual");

	const unsupportedHarness = createHarness({ supportsRestoration: false });
	unsupportedHarness.windowEvents.dispatch("pageshow", { persisted: false });
	unsupportedHarness.runNextFrame();
	unsupportedHarness.runNextFrame();
	assert.equal(unsupportedHarness.document.documentElement.scrollTop, 0);
	assert.equal("scrollRestoration" in unsupportedHarness.history, false);
});
