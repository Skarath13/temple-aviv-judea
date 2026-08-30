import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";

const MAX_STATIC_ASSET_BYTES = 25 * 1024 * 1024;
const assets = [
	{
		path: "public/_hero-media/mobile-jerusalem-v1.mp4",
		bytes: 2_921_987,
		sha256: "6b67df5ff4f24549b286abaffa439d9008a6b6fd1cdebe552d734458bb7e4028",
	},
	{
		path: "public/_hero-media/mobile-jerusalem-v1.webm",
		bytes: 1_850_076,
		sha256: "68f4fca47ca0e38300dcee62d5f372c23ea9c08e1e6bbd44279e3d56d9509e68",
	},
	{
		path: "public/videos/hero/mobile-jerusalem-v2-poster.webp",
		bytes: 296_010,
		sha256: "8d10dc29b2482e2e1272e4189a955632a7732c67f6d6e6f78c30459be996e4f3",
	},
];

for (const asset of assets) {
	const [contents, details] = await Promise.all([
		readFile(asset.path),
		stat(asset.path),
	]);
	const sha256 = createHash("sha256").update(contents).digest("hex");
	if (details.size !== asset.bytes || sha256 !== asset.sha256) {
		throw new Error(
			`${asset.path} no longer matches its versioned byte and SHA-256 contract.`,
		);
	}
	if (details.size >= MAX_STATIC_ASSET_BYTES) {
		throw new Error(
			`${asset.path} exceeds the Workers Static Assets file limit.`,
		);
	}
}

const mp4 = await readFile(assets[0].path);
const ftypOffset = mp4.indexOf(Buffer.from("ftyp"));
const moovOffset = mp4.indexOf(Buffer.from("moov"));
const mdatOffset = mp4.indexOf(Buffer.from("mdat"));
if (
	ftypOffset < 0 ||
	moovOffset < 0 ||
	mdatOffset < 0 ||
	moovOffset > mdatOffset
) {
	throw new Error("The MP4 lost its required faststart container ordering.");
}
if (mp4.includes(Buffer.from("soun"))) {
	throw new Error("The decorative MP4 unexpectedly contains an audio handler.");
}

console.log("Versioned hero media integrity passed.");
