import assert from "node:assert/strict";
import test from "node:test";
import { createForm } from "final-form";
import arrayMutators from "final-form-arrays";
import { JSDOM } from "jsdom";
import { act, createElement, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Form, useField } from "react-final-form";

// Exercise the same field mount/unmount cycle Tina uses for list breadcrumbs.
// Checking the underlying values catches edits disappearing without a UI error.
const withEditor = async (initialValues, run, destroyOnUnregister = false) => {
	const dom = new JSDOM("<div id='root'></div>");
	const previous = {
		window: globalThis.window,
		document: globalThis.document,
		IS_REACT_ACT_ENVIRONMENT: globalThis.IS_REACT_ACT_ENVIRONMENT,
	};
	globalThis.window = dom.window;
	globalThis.document = dom.window.document;
	globalThis.IS_REACT_ACT_ENVIRONMENT = true;
	const form = createForm({
		initialValues,
		destroyOnUnregister,
		onSubmit: () => {},
		mutators: arrayMutators,
	});
	const root = createRoot(dom.window.document.getElementById("root"));
	const Probe = ({ name }) => {
		useField(name);
		return null;
	};
	const show = (name) =>
		act(async () => {
			root.render(
				createElement(
					StrictMode,
					null,
					createElement(
						Form,
						{ form, destroyOnUnregister, onSubmit: () => {} },
						() => createElement(Probe, { name }),
					),
				),
			);
		});
	const change = (name, value) => act(async () => form.change(name, value));
	try {
		await run({ form, show, change });
	} finally {
		await act(async () => root.unmount());
		dom.window.close();
		Object.assign(globalThis, previous);
	}
};

test("CMS list navigation retains a newly typed event instead of restoring the original array", async () => {
	await withEditor(
		{ events: [{ title: "Past event" }] },
		async ({ form, show, change }) => {
			await show("events");
			await act(async () => form.mutators.push("events", { published: false }));
			await show("events.1.title");
			await change("events.1.title", "Shabbat שלום 🕯️");
			await show("events");
			assert.equal(form.getState().values.events.length, 2);
			assert.equal(form.getState().values.events[1].title, "Shabbat שלום 🕯️");
			assert.equal(form.getState().dirty, true);
			await show("events.1.title");
			assert.equal(
				form.getFieldState("events.1.title").value,
				"Shabbat שלום 🕯️",
			);
		},
	);
});

test("CMS field navigation retains edits and intentional clearing of an existing field", async () => {
	await withEditor(
		{ events: [{ title: "Original", summary: "Old summary" }] },
		async ({ form, show, change }) => {
			await show("events.0.title");
			await change("events.0.title", "Updated");
			await show("events.0.summary");
			await change("events.0.summary", undefined);
			await show("events.0.title");
			assert.equal(form.getFieldState("events.0.title").value, "Updated");
			await show("events.0.summary");
			assert.equal(form.getFieldState("events.0.summary").value, undefined);
			assert.equal(form.getState().dirty, true);
		},
	);
});

test("CMS list navigation preserves removals and an intentionally empty schedule", async () => {
	await withEditor(
		{ events: [{ title: "One" }, { title: "Two" }] },
		async ({ form, show }) => {
			await show("events");
			await act(async () => form.mutators.remove("events", 0));
			await show("events.0.title");
			assert.equal(form.getFieldState("events.0.title").value, "Two");
			await show("events");
			await act(async () => form.mutators.remove("events", 0));
			await show("sectionCopy.heading");
			await show("events");
			assert.deepEqual(form.getState().values.events, []);
		},
	);
});

test("explicit Reset still restores original event content", async () => {
	await withEditor(
		{ events: [{ title: "Original" }] },
		async ({ form, show, change }) => {
			await show("events.0.title");
			await change("events.0.title", "Edited");
			await act(async () => form.reset());
			assert.equal(form.getFieldState("events.0.title").value, "Original");
			assert.equal(form.getState().pristine, true);
		},
	);
});

test("forms that explicitly destroy unmounted values retain their initialization behavior", async () => {
	await withEditor(
		{ title: "Original" },
		async ({ form, show, change }) => {
			await show("title");
			await change("title", "Edited");
			await show("other");
			await show("title");
			assert.equal(form.getFieldState("title").value, "Original");
		},
		true,
	);
});
