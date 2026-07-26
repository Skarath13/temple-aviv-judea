import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';

const MAX_STATIC_ASSET_BYTES = 25 * 1024 * 1024;
const assets = [
  {
    path: 'public/_hero-media/mobile-jerusalem-v1.mp4',
    bytes: 2_921_987,
    sha256: '6b67df5ff4f24549b286abaffa439d9008a6b6fd1cdebe552d734458bb7e4028',
  },
  {
    path: 'public/_hero-media/mobile-jerusalem-v1.webm',
    bytes: 1_850_076,
    sha256: '68f4fca47ca0e38300dcee62d5f372c23ea9c08e1e6bbd44279e3d56d9509e68',
  },
  {
    path: 'public/videos/hero/mobile-jerusalem-v2-poster.webp',
    bytes: 296_010,
    sha256: '8d10dc29b2482e2e1272e4189a955632a7732c67f6d6e6f78c30459be996e4f3',
  },
];

for (const asset of assets) {
  const [contents, details] = await Promise.all([
    readFile(asset.path),
    stat(asset.path),
  ]);
  const sha256 = createHash('sha256').update(contents).digest('hex');

  if (details.size !== asset.bytes) {
    throw new Error(
      `${asset.path} is ${details.size} bytes; expected ${asset.bytes}. ` +
        'Review and update the versioned media contract intentionally.',
    );
  }
  if (sha256 !== asset.sha256) {
    throw new Error(
      `${asset.path} failed its SHA-256 integrity check. ` +
        'Use a new versioned filename for intentional replacements.',
    );
  }
  if (details.size >= MAX_STATIC_ASSET_BYTES) {
    throw new Error(
      `${asset.path} exceeds the 25 MiB Workers Static Assets file limit.`,
    );
  }
}

const mp4 = await readFile(assets[0].path);
const ftypOffset = mp4.indexOf(Buffer.from('ftyp'));
const moovOffset = mp4.indexOf(Buffer.from('moov'));
const mdatOffset = mp4.indexOf(Buffer.from('mdat'));

if (ftypOffset < 0 || moovOffset < 0 || mdatOffset < 0 || moovOffset > mdatOffset) {
  throw new Error(
    'The MP4 container is missing ftyp/moov/mdat or no longer has faststart ordering.',
  );
}
if (mp4.includes(Buffer.from('soun'))) {
  throw new Error('The decorative MP4 unexpectedly contains an audio handler.');
}

const sourceContracts = [
  {
    path: 'public/_headers',
    tokens: [
      '/videos/hero/*',
      'Cache-Control: public, max-age=31536000, immutable',
      'X-Content-Type-Options: nosniff',
    ],
  },
  {
    path: 'src/components/pages/HomePage.astro',
    tokens: [
      'autoplay',
      'defaultMuted',
      'disablepictureinpicture',
      'hero-desktop-detail',
      'loop',
      'mobile-hero-continuation',
      'muted',
      'playsinline',
      'preload="auto"',
      "prefers-reduced-motion: reduce",
      'requestVideoFrameCallback',
      'srcset={heroVideoPoster}',
      'type="video/mp4"',
      'type="video/webm"',
    ],
    forbiddenTokens: ['poster={heroVideoPoster}'],
  },
  {
    path: 'src/layouts/BaseLayout.astro',
    tokens: ['rel="preload"', 'fetchpriority="high"'],
  },
  {
    path: 'src/lib/mobile-hero-video.mjs',
    tokens: [
      'IntersectionObserver',
      'pagehide',
      'pageshow',
      'playAttemptTimeout',
      'requestVideoFrameCallback',
      'recoveryInFlight',
      'visibilitychange',
    ],
  },
  {
    path: 'src/lib/hero-media-range.mjs',
    tokens: [
      'Accept-Ranges',
      'Content-Range',
      'If-Range',
      'X-Hero-Media-Cache',
      'cacheStorage.open',
      'waitUntil',
    ],
  },
  {
    path: 'src/lib/hero-media-route.ts',
    tokens: [
      'caches',
      'env.ASSETS',
      'heroMediaRequestHandler',
      'prerender = false',
    ],
  },
  {
    path: 'src/styles/global.css',
    tokens: [
      '100svh',
      '(max-width: 380px) and (max-height: 700px)',
      'hero-scrim { display: none; }',
      'mobile-hero-continuation',
      'object-fit: contain',
      'transition: none',
    ],
    forbiddenTokens: [
      'hero-video-backdrop',
      'mask-image',
    ],
  },
  {
    path: 'wrangler.jsonc',
    tokens: [
      '"run_worker_first"',
      '"/videos/hero/*.mp4"',
      '"/videos/hero/*.webm"',
    ],
  },
];

for (const contract of sourceContracts) {
  const contents = await readFile(contract.path, 'utf8');
  for (const token of contract.tokens) {
    if (!contents.includes(token)) {
      throw new Error(`${contract.path} is missing required hero contract: ${token}`);
    }
  }
  for (const token of contract.forbiddenTokens ?? []) {
    if (contents.includes(token)) {
      throw new Error(`${contract.path} contains forbidden hero treatment: ${token}`);
    }
  }
}

const homePage = await readFile('src/components/pages/HomePage.astro', 'utf8');
if (homePage.indexOf('type="video/mp4"') > homePage.indexOf('type="video/webm"')) {
  throw new Error('The H.264 source must remain first for Safari compatibility.');
}

console.log('Verified versioned hero media integrity and playback markup contracts.');
