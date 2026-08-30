export const HERO_MEDIA_CACHE_NAME = "taj-hero-media-v1";

const IMMUTABLE_CACHE_CONTROL = "public, max-age=31536000, immutable";
const mediaContracts = new Map([
	[
		"/videos/hero/mobile-jerusalem-v1.mp4",
		{
			bytes: 2_921_987,
			contentType: "video/mp4",
			etag: '"6b67df5ff4f24549b286abaffa439d9008a6b6fd1cdebe552d734458bb7e4028"',
			internalPath: "/_hero-media/mobile-jerusalem-v1.mp4",
		},
	],
	[
		"/videos/hero/mobile-jerusalem-v1.webm",
		{
			bytes: 1_850_076,
			contentType: "video/webm",
			etag: '"68f4fca47ca0e38300dcee62d5f372c23ea9c08e1e6bbd44279e3d56d9509e68"',
			internalPath: "/_hero-media/mobile-jerusalem-v1.webm",
		},
	],
]);

const createHeaders = (contract, cacheStatus) => {
	const headers = new Headers({
		"Accept-Ranges": "bytes",
		"Cache-Control": IMMUTABLE_CACHE_CONTROL,
		"Content-Length": String(contract.bytes),
		"Content-Type": contract.contentType,
		ETag: contract.etag,
		"X-Content-Type-Options": "nosniff",
		"X-Hero-Media-Cache": cacheStatus,
	});
	return headers;
};

const createErrorResponse = (status, message, contract, cacheStatus) => {
	const headers = createHeaders(contract, cacheStatus);
	headers.set("Cache-Control", "no-store");
	headers.set(
		"Content-Length",
		String(new TextEncoder().encode(message).length),
	);
	headers.set("Content-Type", "text/plain; charset=utf-8");
	return new Response(message, { status, headers });
};

const createUnsatisfiableResponse = (contract) => {
	const headers = createHeaders(contract, "BYPASS");
	headers.set("Content-Length", "0");
	headers.set("Content-Range", `bytes */${contract.bytes}`);
	return new Response(null, { status: 416, headers });
};

export const parseSingleRange = (value, size) => {
	if (typeof value !== "string" || !value.startsWith("bytes=")) return null;
	const specification = value.slice(6).trim();
	if (!specification || specification.includes(",")) return null;

	const match = /^(\d*)-(\d*)$/.exec(specification);
	if (!match || (!match[1] && !match[2])) return null;

	if (!match[1]) {
		const suffixLength = Number(match[2]);
		if (!Number.isSafeInteger(suffixLength) || suffixLength <= 0) return null;
		return {
			end: size - 1,
			start: Math.max(0, size - suffixLength),
		};
	}

	const start = Number(match[1]);
	const requestedEnd = match[2] ? Number(match[2]) : size - 1;
	if (
		!Number.isSafeInteger(start) ||
		!Number.isSafeInteger(requestedEnd) ||
		start < 0 ||
		requestedEnd < start ||
		start >= size
	) {
		return null;
	}

	return {
		end: Math.min(requestedEnd, size - 1),
		start,
	};
};

const ifRangeAllowsRange = (value, etag) => {
	if (!value) return true;
	const candidate = value.trim();
	if (!candidate || candidate.startsWith("W/")) return false;
	return candidate === etag;
};

const hasExpectedCachedRepresentation = (response, contract) =>
	response.status === 200 &&
	response.body !== null &&
	response.headers.get("Content-Type") === contract.contentType &&
	Number(response.headers.get("Content-Length")) === contract.bytes;

const hasExpectedCachedRange = (response, contract, range) =>
	response.status === 206 &&
	response.body !== null &&
	response.headers.get("Content-Type") === contract.contentType &&
	Number(response.headers.get("Content-Length")) ===
		range.end - range.start + 1 &&
	response.headers.get("Content-Range") ===
		`bytes ${range.start}-${range.end}/${contract.bytes}`;

const hasExpectedOriginHeaders = (response, contract) => {
	if (
		response.status !== 200 ||
		response.body === null ||
		response.headers.get("Content-Type") !== contract.contentType
	) {
		return false;
	}

	const declaredLength = response.headers.get("Content-Length");
	return declaredLength === null || Number(declaredLength) === contract.bytes;
};

const normalizeFullResponse = (response, contract) =>
	new Response(response.body, {
		headers: createHeaders(contract, "STORED"),
		status: 200,
	});

const canonicalCacheKey = (request) => {
	const url = new URL(request.url);
	url.search = "";
	url.hash = "";
	return new Request(url, { method: "GET" });
};

const fetchFullRepresentation = async ({
	assetFetcher,
	cache,
	cacheKey,
	context,
	contract,
	request,
}) => {
	const cached = await cache.match(cacheKey);
	if (cached) {
		if (hasExpectedCachedRepresentation(cached, contract)) {
			return {
				cacheStatus: "HIT",
				response: normalizeFullResponse(cached, contract),
			};
		}
		await cached.body?.cancel("invalid-cached-hero-media");
		await cache.delete(cacheKey);
	}

	const internalUrl = new URL(contract.internalPath, request.url);
	const assetResponse = await assetFetcher.fetch(
		new Request(internalUrl, { method: "GET" }),
	);
	if (!hasExpectedOriginHeaders(assetResponse, contract)) {
		await assetResponse.body?.cancel("invalid-origin-hero-media");
		return {
			cacheStatus: "ERROR",
			response: createErrorResponse(
				502,
				"Hero media is temporarily unavailable.",
				contract,
				"ERROR",
			),
		};
	}

	let response;
	if (assetResponse.headers.get("Content-Length") === null) {
		const assetBytes = await assetResponse.arrayBuffer();
		if (assetBytes.byteLength !== contract.bytes) {
			return {
				cacheStatus: "ERROR",
				response: createErrorResponse(
					502,
					"Hero media is temporarily unavailable.",
					contract,
					"ERROR",
				),
			};
		}
		response = normalizeFullResponse(new Response(assetBytes), contract);
	} else {
		response = normalizeFullResponse(assetResponse, contract);
	}

	context.waitUntil(
		cache.put(cacheKey, response.clone()).catch(() => undefined),
	);
	return { cacheStatus: "MISS", response };
};

const createRangedCacheKey = (cacheKey, range) =>
	new Request(cacheKey.url, {
		headers: { Range: `bytes=${range.start}-${range.end}` },
		method: "GET",
	});

const matchCachedRange = async ({ cache, cacheKey, contract, range }) => {
	const cached = await cache.match(createRangedCacheKey(cacheKey, range));
	if (!cached) return null;
	if (hasExpectedCachedRange(cached, contract, range)) return cached;

	await cached.body?.cancel("invalid-cached-hero-media-range");
	return null;
};

export const createRangeStream = (body, range, context) => {
	const reader = body.getReader();
	let sourceOffset = 0;

	return new ReadableStream({
		async cancel(reason) {
			await reader.cancel(reason);
		},
		async pull(controller) {
			while (true) {
				const { done, value } = await reader.read();
				if (done) {
					controller.error(
						new Error("Hero media ended before the requested range."),
					);
					return;
				}

				const chunkStart = sourceOffset;
				const chunkEnd = chunkStart + value.byteLength - 1;
				sourceOffset += value.byteLength;

				if (chunkEnd < range.start) continue;

				const sliceStart = Math.max(0, range.start - chunkStart);
				const sliceEnd = Math.min(value.byteLength, range.end - chunkStart + 1);
				if (sliceEnd > sliceStart) {
					controller.enqueue(value.subarray(sliceStart, sliceEnd));
				}

				if (chunkEnd >= range.end) {
					controller.close();
					context.waitUntil(reader.cancel("hero-media-range-complete"));
				}
				return;
			}
		},
	});
};

const createFixedLengthRangeStream = (body, range, context) => {
	const rangeStream = createRangeStream(body, range, context);
	if (typeof globalThis.FixedLengthStream !== "function") return rangeStream;

	const expectedLength = range.end - range.start + 1;
	const fixedLengthStream = new globalThis.FixedLengthStream(expectedLength);
	context.waitUntil(
		rangeStream.pipeTo(fixedLengthStream.writable).catch(() => undefined),
	);
	return fixedLengthStream.readable;
};

export const createHeroMediaRequestHandler =
	({ assetFetcher, cacheStorage, context }) =>
	async (request) => {
		const method = request.method.toUpperCase();
		const contract = mediaContracts.get(new URL(request.url).pathname);
		if (!contract) return new Response("Not Found", { status: 404 });
		if (method !== "GET" && method !== "HEAD") {
			return new Response("Method Not Allowed", {
				headers: { Allow: "GET, HEAD" },
				status: 405,
			});
		}

		const rangeHeader = request.headers.get("Range");
		const shouldUseRange =
			rangeHeader !== null &&
			ifRangeAllowsRange(request.headers.get("If-Range"), contract.etag);
		const range = shouldUseRange
			? parseSingleRange(rangeHeader, contract.bytes)
			: null;
		if (shouldUseRange && range === null) {
			return createUnsatisfiableResponse(contract);
		}

		if (method === "HEAD") {
			const headers = createHeaders(contract, "BYPASS");
			if (range) {
				headers.set("Content-Length", String(range.end - range.start + 1));
				headers.set(
					"Content-Range",
					`bytes ${range.start}-${range.end}/${contract.bytes}`,
				);
				return new Response(null, { headers, status: 206 });
			}
			return new Response(null, { headers, status: 200 });
		}

		const cache = await cacheStorage.open(HERO_MEDIA_CACHE_NAME);
		const cacheKey = canonicalCacheKey(request);
		if (range) {
			const cachedRange = await matchCachedRange({
				cache,
				cacheKey,
				contract,
				range,
			});
			if (cachedRange) {
				const headers = createHeaders(contract, "HIT");
				headers.set("Content-Length", String(range.end - range.start + 1));
				headers.set(
					"Content-Range",
					`bytes ${range.start}-${range.end}/${contract.bytes}`,
				);
				return new Response(cachedRange.body, { headers, status: 206 });
			}
		}

		const full = await fetchFullRepresentation({
			assetFetcher,
			cache,
			cacheKey,
			context,
			contract,
			request,
		});
		if (full.response.status !== 200) return full.response;

		if (range) {
			const headers = createHeaders(contract, full.cacheStatus);
			const contentLength = range.end - range.start + 1;
			headers.set("Content-Length", String(contentLength));
			headers.set(
				"Content-Range",
				`bytes ${range.start}-${range.end}/${contract.bytes}`,
			);
			return new Response(
				createFixedLengthRangeStream(full.response.body, range, context),
				{ headers, status: 206 },
			);
		}

		const headers = createHeaders(contract, full.cacheStatus);
		return new Response(full.response.body, { headers, status: 200 });
	};
