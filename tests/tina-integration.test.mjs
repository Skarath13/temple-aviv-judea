import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { normalizePageFrontmatter } from "../src/lib/page-frontmatter.mjs";
import { resolveTinaBranch } from "../src/lib/tina/branch.mjs";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("all six retained public pages use the typed CMS page boundary", async () => {
	const routes = new Map([
		["src/pages/index.astro", "home"],
		["src/pages/visit.astro", "visit"],
		["src/pages/story.astro", "story"],
		["src/pages/beliefs.astro", "beliefs"],
		["src/pages/ministries.astro", "ministries"],
		["src/pages/give.astro", "give"],
	]);

	for (const [path, pageKey] of routes) {
		const source = await read(path);
		assert.match(source, /import CmsPage from/);
		assert.match(source, new RegExp(`<CmsPage pageKey=["']${pageKey}["']`));
	}
});

test("page, settings, and event preview queries retain Tina metadata", async () => {
	const source = await read("src/lib/tina/data.ts");
	assert.match(source, /requestWithMetadata\([\s\S]*client\.queries\.page/);
	assert.match(source, /client\.queries\.siteSettings/);
	assert.match(source, /client\.queries\.eventSchedule/);
	assert.match(source, /priority:\s*['"]primary['"]/);
});

test("visual editing has one primary page island plus live global islands", async () => {
	const [page, layout, registry] = await Promise.all([
		read("src/components/pages/CmsPage.astro"),
		read("src/layouts/BaseLayout.astro"),
		read("src/lib/tina/islands.ts"),
	]);

	assert.match(page, /<TinaIsland name="page"[^>]*primary>/);
	assert.match(page, /params=\{\{\s*page:\s*pageKey\s*\}\}/);
	assert.match(layout, /<TinaIsland name="header"/);
	assert.match(layout, /<TinaIsland name="footer"/);
	assert.match(layout, /new MutationObserver\(refreshExpiredEvents\)/);
	for (const name of ["page", "header", "footer"]) {
		assert.match(registry, new RegExp(`\\n\\s+${name}:\\s*\\{`));
	}
	assert.match(registry, /getTinaPageBundle/);
	assert.match(registry, /getTinaSiteSettings/);
});

test("visible nested content exposes granular click-to-edit markers", async () => {
	const [home, beliefs, visit, story, ministries, sections] = await Promise.all(
		[
			read("src/components/pages/HomePage.astro"),
			read("src/components/pages/BeliefsPage.astro"),
			read("src/components/pages/VisitPage.astro"),
			read("src/components/pages/StoryPage.astro"),
			read("src/components/pages/MinistriesPage.astro"),
			read("src/components/CmsSections.astro"),
		],
	);

	for (const field of [
		"title",
		"emphasis",
		"closing",
		"captionTitle",
		"captionSubtitle",
		"mapAppLabel",
	]) {
		assert.match(home, new RegExp(`tinaField\\([^,]+, ['"]${field}['"]\\)`));
	}
	for (const [source, fields] of [
		[beliefs, ["caption", "references", "paragraphs"]],
		[visit, ["flowIntro", "flow"]],
		[story, ["year", "names"]],
		[ministries, ["credit", "buttonLabel", "contactLabel"]],
		[sections, ["body", "image", "linkLabel", "buttonLabel"]],
	]) {
		for (const field of fields) {
			assert.match(
				source,
				new RegExp(`tinaField\\([^,]+, ['"]${field}['"]\\)`),
			);
		}
	}
});

test("the lazy Google map remains primary and map-app directions are additive", async () => {
	const [home, settingsSchema, contentRules] = await Promise.all([
		read("src/components/pages/HomePage.astro"),
		read("tina/collections/site-settings.ts"),
		read("src/lib/content-rules.mjs"),
	]);

	assert.match(home, /<iframe[^>]+loading=["']lazy["']/);
	assert.match(home, /cmsGoogleMapsEmbed\(address\.embed\)/);
	assert.match(home, /cmsMapAppLink\(address\.mapApp\)/);
	assert.match(home, /tinaField\(address, ['"]mapApp['"]\)/);
	assert.match(settingsSchema, /name:\s*['"]mapApp['"]/);
	assert.match(
		contentRules,
		/mapApp:\s*Object\.freeze\(\[['"]maps\.rbt\.no['"]\]\)/,
	);
});

test("an empty event schedule remains discoverable only inside Tina preview", async () => {
	const [layout, events, styles] = await Promise.all([
		read("src/layouts/BaseLayout.astro"),
		read("src/components/UpcomingEvents.astro"),
		read("src/styles/global.css"),
	]);
	assert.match(layout, /classList\.add\(['"]tina-preview['"]\)/);
	assert.match(events, /tina-empty-events/);
	assert.match(events, /tinaField\(schedule, ['"]events['"]\)/);
	assert.match(styles, /\.tina-empty-events\s*\{\s*display:\s*none/);
	assert.match(
		styles,
		/html\.tina-preview \.tina-empty-events\s*\{\s*display:\s*block/,
	);
});

test("the preview renderer stays an on-demand Tina route", async () => {
	const [config, route] = await Promise.all([
		read("astro.config.mjs"),
		read("src/lib/tina/island-route.ts"),
	]);

	assert.match(config, /pattern:\s*['"]\/tina-island\/\[name\]['"]/);
	assert.match(config, /prerender:\s*false/);
	assert.match(route, /experimental_createIslandRoute\(islands\)/);
});

test("the Cloudflare build validates content before Astro emits a Worker", async () => {
	const packageJson = JSON.parse(await read("package.json"));
	const command = packageJson.scripts["build:cloudflare"];
	assert.match(
		command,
		/^bun run validate:content && TINA_CMS=true tinacms build/,
	);
	assert.match(command, /-c "astro check && astro build"$/);
});

test("static MDX frontmatter normalizes nested rich text for CMS sections", () => {
	const page = normalizePageFrontmatter({
		sections: [{ _template: "content", body: "Welcome **home**." }],
	});

	assert.equal(page.sections[0].body.type, "root");
	assert.equal(page.sections[0].body.children[0].children[0].text, "Welcome ");
	assert.equal(page.sections[0].body.children[0].children[1].text, "home");
	assert.equal(page.sections[0].body.children[0].children[1].bold, true);
});

test("the retired Artists page redirects to consolidated creative arts content", async () => {
	const [config, footer, ministries] = await Promise.all([
		read("astro.config.mjs"),
		read("src/components/Footer.astro"),
		read("src/components/pages/MinistriesPage.astro"),
	]);
	assert.match(
		config,
		/['"]\/artists\/['"]:\s*`[^`]*\/ministries\/#creative-arts`/,
	);
	assert.doesNotMatch(footer, /\/artists\//);
	assert.match(ministries, /id=["']creative-arts["']/);
});

test("Cloudflare branch injection wins and local mode safely falls back to main", () => {
	assert.equal(resolveTinaBranch({}), "main");
	assert.equal(resolveTinaBranch({ WORKERS_CI_BRANCH: "main" }), "main");
	assert.equal(
		resolveTinaBranch({
			WORKERS_CI_BRANCH: "cloudflare-branch",
			GITHUB_BRANCH: "unrelated-branch",
		}),
		"cloudflare-branch",
	);
	assert.equal(
		resolveTinaBranch({ WORKERS_CI_BRANCH: "   ", HEAD: "preview" }),
		"preview",
	);
});
