import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createRangeStream,
  createHeroMediaRequestHandler,
  HERO_MEDIA_CACHE_NAME,
} from '../src/lib/hero-media-range.mjs';

const MP4_PATH = '/videos/hero/mobile-jerusalem-v1.mp4';
const MP4_BYTES = 2_921_987;
const MP4_ETAG =
  '"6b67df5ff4f24549b286abaffa439d9008a6b6fd1cdebe552d734458bb7e4028"';

class MemoryCache {
  constructor() {
    this.entries = new Map();
  }

  async delete(request) {
    return this.entries.delete(request.url);
  }

  async match(request) {
    return this.entries.get(request.url)?.clone();
  }

  async put(request, response) {
    const body = await response.arrayBuffer();
    this.entries.set(
      request.url,
      new Response(body, {
        headers: response.headers,
        status: response.status,
      }),
    );
  }
}

class MemoryCacheStorage {
  constructor() {
    this.cache = new MemoryCache();
    this.openedNames = [];
  }

  async open(name) {
    this.openedNames.push(name);
    return this.cache;
  }
}

const createByteStream = (bytes, cancellation, chunkSize = 64 * 1024) => {
  let offset = 0;
  return new ReadableStream({
    cancel(reason) {
      cancellation.reasons.push(reason);
    },
    pull(controller) {
      if (offset >= bytes.byteLength) {
        controller.close();
        return;
      }
      const end = Math.min(offset + chunkSize, bytes.byteLength);
      controller.enqueue(bytes.subarray(offset, end));
      offset = end;
    },
  });
};

const createHarness = ({
  contentLength = MP4_BYTES,
  sourceBytes = MP4_BYTES,
} = {}) => {
  const bytes = new Uint8Array(sourceBytes);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = index % 251;
  }
  const cancellation = { reasons: [] };
  const cacheStorage = new MemoryCacheStorage();
  const tasks = [];
  const context = {
    waitUntil(promise) {
      tasks.push(promise);
    },
  };
  const assetFetcher = {
    calls: [],
    async fetch(request) {
      this.calls.push(request.url);
      const headers = new Headers({ 'Content-Type': 'video/mp4' });
      if (contentLength !== null) {
        headers.set('Content-Length', String(contentLength));
      }
      return new Response(createByteStream(bytes, cancellation), {
        headers,
      });
    },
  };
  const handler = createHeroMediaRequestHandler({
    assetFetcher,
    cacheStorage,
    context,
  });

  return {
    assetFetcher,
    bytes,
    cacheStorage,
    cancellation,
    handler,
    settle: () => Promise.all(tasks.splice(0)),
  };
};

const request = (path = MP4_PATH, init = {}) =>
  new Request(`https://www.avivjudea.org${path}`, init);

test('serves and caches the complete immutable representation', async () => {
  const harness = createHarness();
  const response = await harness.handler(request());
  const body = new Uint8Array(await response.arrayBuffer());
  await harness.settle();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Accept-Ranges'), 'bytes');
  assert.equal(response.headers.get('Content-Length'), String(MP4_BYTES));
  assert.equal(response.headers.get('Content-Type'), 'video/mp4');
  assert.equal(response.headers.get('ETag'), MP4_ETAG);
  assert.equal(response.headers.get('X-Content-Type-Options'), 'nosniff');
  assert.equal(response.headers.get('X-Hero-Media-Cache'), 'MISS');
  assert.equal(body.byteLength, MP4_BYTES);
  assert.equal(harness.assetFetcher.calls.length, 1);
  assert.deepEqual(harness.cacheStorage.openedNames, [HERO_MEDIA_CACHE_NAME]);
});

test('verifies the body when the asset binding omits Content-Length', async () => {
  const harness = createHarness({ contentLength: null });
  const response = await harness.handler(request());
  const body = await response.arrayBuffer();
  await harness.settle();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Content-Length'), String(MP4_BYTES));
  assert.equal(body.byteLength, MP4_BYTES);
  assert.equal(harness.cacheStorage.cache.entries.size, 1);
});

test('uses one canonical cache entry across recovery query parameters', async () => {
  const harness = createHarness();
  const first = await harness.handler(request(`${MP4_PATH}?recovery=1`));
  await first.arrayBuffer();
  await harness.settle();

  const second = await harness.handler(request(`${MP4_PATH}?recovery=9`));
  await second.arrayBuffer();

  assert.equal(second.headers.get('X-Hero-Media-Cache'), 'HIT');
  assert.equal(harness.assetFetcher.calls.length, 1);
  assert.equal(harness.cacheStorage.cache.entries.size, 1);
});

test('serves HEAD with representation headers and no body', async () => {
  const harness = createHarness();
  const response = await harness.handler(request(MP4_PATH, { method: 'HEAD' }));
  await harness.settle();

  assert.equal(response.status, 200);
  assert.equal(response.body, null);
  assert.equal(response.headers.get('Content-Length'), String(MP4_BYTES));
  assert.equal(response.headers.get('Accept-Ranges'), 'bytes');
});

test('serves closed, suffix, and open-ended byte ranges', async () => {
  const cases = [
    ['bytes=0-1', 0, 1],
    ['bytes=-3', MP4_BYTES - 3, MP4_BYTES - 1],
    ['bytes=2919987-', 2_919_987, MP4_BYTES - 1],
  ];

  for (const [header, start, end] of cases) {
    const harness = createHarness();
    const response = await harness.handler(
      request(MP4_PATH, { headers: { Range: header } }),
    );
    const body = new Uint8Array(await response.arrayBuffer());
    await harness.settle();

    assert.equal(response.status, 206);
    assert.equal(
      response.headers.get('Content-Range'),
      `bytes ${start}-${end}/${MP4_BYTES}`,
    );
    assert.equal(response.headers.get('Content-Length'), String(end - start + 1));
    assert.deepEqual(body, harness.bytes.subarray(start, end + 1));
  }
});

test('returns 416 for invalid, multipart, and unsatisfiable ranges', async () => {
  const headers = [
    'items=0-1',
    'bytes=',
    'bytes=4-2',
    'bytes=0-1,3-4',
    `bytes=${MP4_BYTES}-`,
  ];

  for (const range of headers) {
    const harness = createHarness();
    const response = await harness.handler(
      request(MP4_PATH, { headers: { Range: range } }),
    );

    assert.equal(response.status, 416);
    assert.equal(
      response.headers.get('Content-Range'),
      `bytes */${MP4_BYTES}`,
    );
    assert.equal(response.headers.get('Content-Length'), '0');
    assert.equal(harness.assetFetcher.calls.length, 0);
  }
});

test('honors matching If-Range and ignores a range for mismatched validators', async () => {
  const matchingHarness = createHarness();
  const matching = await matchingHarness.handler(
    request(MP4_PATH, {
      headers: { 'If-Range': MP4_ETAG, Range: 'bytes=0-1' },
    }),
  );
  assert.equal(matching.status, 206);
  await matching.arrayBuffer();
  await matchingHarness.settle();

  const mismatchHarness = createHarness();
  const mismatch = await mismatchHarness.handler(
    request(MP4_PATH, {
      headers: { 'If-Range': '"different"', Range: 'bytes=0-1' },
    }),
  );
  const mismatchBody = await mismatch.arrayBuffer();
  await mismatchHarness.settle();

  assert.equal(mismatch.status, 200);
  assert.equal(mismatchBody.byteLength, MP4_BYTES);
  assert.equal(mismatch.headers.get('Content-Range'), null);
});

test('serves ranged HEAD metadata without a body', async () => {
  const harness = createHarness();
  const response = await harness.handler(
    request(MP4_PATH, {
      headers: { Range: 'bytes=0-1' },
      method: 'HEAD',
    }),
  );
  await harness.settle();

  assert.equal(response.status, 206);
  assert.equal(response.body, null);
  assert.equal(response.headers.get('Content-Length'), '2');
  assert.equal(
    response.headers.get('Content-Range'),
    `bytes 0-1/${MP4_BYTES}`,
  );
});

test('rejects a truncated asset contract instead of caching it', async () => {
  const harness = createHarness({
    contentLength: MP4_BYTES - 1,
    sourceBytes: MP4_BYTES - 1,
  });
  const response = await harness.handler(request());
  const body = await response.text();

  assert.equal(response.status, 502);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.equal(response.headers.get('X-Hero-Media-Cache'), 'ERROR');
  assert.match(body, /temporarily unavailable/);
  assert.equal(harness.cacheStorage.cache.entries.size, 0);
});

test('cancels the source stream after completing a probe range', async () => {
  const cancellation = { reasons: [] };
  const tasks = [];
  const context = {
    waitUntil(promise) {
      tasks.push(promise);
    },
  };
  const source = new ReadableStream({
    cancel(reason) {
      cancellation.reasons.push(reason);
    },
    start(controller) {
      controller.enqueue(new Uint8Array([0, 1, 2, 3]));
    },
  });
  const stream = createRangeStream(
    source,
    { end: 1, start: 0 },
    context,
  );
  const response = new Response(stream);

  assert.deepEqual(
    new Uint8Array(await response.arrayBuffer()),
    new Uint8Array([0, 1]),
  );
  await Promise.all(tasks);

  assert.ok(
    cancellation.reasons.includes('hero-media-range-complete'),
  );
});

test('rejects unknown files and unsupported methods', async () => {
  const harness = createHarness();
  assert.equal(
    (await harness.handler(request('/videos/hero/unknown.mp4'))).status,
    404,
  );
  assert.equal(
    (await harness.handler(request(MP4_PATH, { method: 'POST' }))).status,
    405,
  );
});
