export const YOUTUBE_CTA_NOTICE_EXPIRES_AT = '2026-07-29T05:00:00.000Z';

export const isYouTubeCtaNoticeActive = (
  now = Date.now(),
  expiresAt = YOUTUBE_CTA_NOTICE_EXPIRES_AT,
) => {
  const expiresAtMs = Date.parse(expiresAt);
  return Number.isFinite(expiresAtMs) && now < expiresAtMs;
};
