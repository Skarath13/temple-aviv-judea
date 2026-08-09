import assert from 'node:assert/strict';
import test from 'node:test';

import {
  YOUTUBE_CTA_NOTICE_EXPIRES_AT,
  isYouTubeCtaNoticeActive,
} from '../src/lib/youtube-cta-notice.mjs';

test('YouTube CTA notice remains active immediately before the cutoff', () => {
  const cutoff = Date.parse(YOUTUBE_CTA_NOTICE_EXPIRES_AT);

  assert.equal(isYouTubeCtaNoticeActive(cutoff - 1), true);
});

test('YouTube CTA notice expires exactly at the cutoff', () => {
  const cutoff = Date.parse(YOUTUBE_CTA_NOTICE_EXPIRES_AT);

  assert.equal(isYouTubeCtaNoticeActive(cutoff), false);
  assert.equal(isYouTubeCtaNoticeActive(cutoff + 1), false);
});

test('YouTube CTA notice fails open when the cutoff is invalid', () => {
  assert.equal(isYouTubeCtaNoticeActive(Date.now(), 'not-a-date'), false);
});
