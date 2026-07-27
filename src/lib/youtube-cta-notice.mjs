export const YOUTUBE_CTA_NOTICE_EXPIRES_AT = '2026-07-28T15:06:05.000Z';

export const isYouTubeCtaNoticeActive = (
  now = Date.now(),
  expiresAt = YOUTUBE_CTA_NOTICE_EXPIRES_AT,
) => {
  const expiresAtMs = Date.parse(expiresAt);
  return Number.isFinite(expiresAtMs) && now < expiresAtMs;
};
