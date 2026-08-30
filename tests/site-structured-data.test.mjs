import assert from "node:assert/strict";
import test from "node:test";
import {
	createSiteStructuredData,
	formatPublicHours,
	normalizePublicHours,
	serializeJsonLd,
} from "../src/lib/site-structured-data.mjs";

const site = {
	name: "Temple Aviv Judea",
	description: "A Messianic Jewish congregation in Fullerton, California.",
	address: {
		street: "704 E Commonwealth Ave",
		city: "Fullerton, CA 92831",
		locality: "Fullerton",
		region: "CA",
		postalCode: "92831",
		country: "US",
		maps: "https://maps.app.goo.gl/UiN1bc91vG4a8LiGA",
	},
	phoneHref: "tel:+17147484504",
	email: "info@avivjudea.org",
	youtube: "https://www.youtube.com/@templeavivjudea1558/live",
	facebook: "https://www.facebook.com/templeavivjudea/",
	publicHours: [
		{
			dayOfWeek: "Saturday",
			opens: "09:00",
			closes: "16:00",
		},
	],
};

test("creates a stable, GBP-aligned Synagogue entity without review claims", () => {
	const result = createSiteStructuredData({
		site,
		siteRoot: new URL("https://www.avivjudea.org/"),
		imageUrl: new URL("https://www.avivjudea.org/assets/images/taj-logo.png"),
	});

	assert.equal(result["@type"], "Synagogue");
	assert.equal(result["@id"], "https://www.avivjudea.org/#synagogue");
	assert.equal(result.telephone, "+17147484504");
	assert.equal(result.hasMap, site.address.maps);
	assert.deepEqual(result.sameAs, [site.facebook, site.youtube]);
	assert.deepEqual(result.openingHoursSpecification, [
		{
			"@type": "OpeningHoursSpecification",
			dayOfWeek: "https://schema.org/Saturday",
			opens: "09:00",
			closes: "16:00",
		},
	]);
	assert.deepEqual(result.address, {
		"@type": "PostalAddress",
		streetAddress: "704 E Commonwealth Ave",
		addressLocality: "Fullerton",
		addressRegion: "CA",
		postalCode: "92831",
		addressCountry: "US",
	});
	assert.equal("aggregateRating" in result, false);
	assert.equal("review" in result, false);
});

test("formats and sorts public hours consistently", () => {
	const hours = [
		{ dayOfWeek: "Sunday", opens: "10:30", closes: "12:00" },
		{ dayOfWeek: "Saturday", opens: "09:00", closes: "16:00" },
	];

	assert.equal(
		formatPublicHours(hours),
		"Saturday 9 AM–4 PM; Sunday 10:30 AM–12 PM",
	);
});

test("rejects malformed, duplicate, and inverted public hours", () => {
	assert.throws(
		() =>
			normalizePublicHours([
				{ dayOfWeek: "Shabbat", opens: "09:00", closes: "16:00" },
			]),
		/not a valid weekday/,
	);
	assert.throws(
		() =>
			normalizePublicHours([
				{ dayOfWeek: "Saturday", opens: "09:00", closes: "16:00" },
				{ dayOfWeek: "Saturday", opens: "10:00", closes: "12:00" },
			]),
		/duplicate day Saturday/,
	);
	assert.throws(
		() =>
			normalizePublicHours([
				{ dayOfWeek: "Saturday", opens: "16:00", closes: "09:00" },
			]),
		/opens must be before closes/,
	);
});

test("rejects unsafe official URLs and malformed telephone links", () => {
	const input = {
		site,
		siteRoot: new URL("https://www.avivjudea.org/"),
		imageUrl: new URL("https://www.avivjudea.org/assets/images/taj-logo.png"),
	};

	assert.throws(
		() =>
			createSiteStructuredData({
				...input,
				site: { ...site, facebook: "javascript:alert(1)" },
			}),
		/site.facebook must be an HTTPS URL/,
	);
	assert.throws(
		() =>
			createSiteStructuredData({
				...input,
				site: { ...site, phoneHref: "tel:7147484504" },
			}),
		/E.164 telephone link/,
	);
});

test("serializes JSON-LD without allowing a script-closing sequence", () => {
	const serialized = serializeJsonLd({
		description: '</script><script>alert("xss")</script>\u2028',
	});

	assert.doesNotMatch(serialized, /<\/script>/i);
	assert.match(serialized, /\\u003C\/script\\u003E/);
	assert.equal(
		JSON.parse(serialized).description,
		'</script><script>alert("xss")</script>\u2028',
	);
});
