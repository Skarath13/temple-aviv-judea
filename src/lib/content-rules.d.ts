export const allowedSiteHosts: Readonly<{
  etsy: readonly string[];
  facebook: readonly string[];
  googleMaps: readonly string[];
  paypal: readonly string[];
  tinaMedia: readonly string[];
  youtube: readonly string[];
}>;
export const approvedGivingUrl: string;

export function parseSecureUrl(value?: string | null): URL | null;
export function isAllowedSecureUrl(
  value: unknown,
  allowedHosts: readonly string[],
): boolean;
export function isApprovedGivingUrl(value: unknown): boolean;
export function isEmailAddress(value: unknown): boolean;
export function isTelephoneLink(value: unknown): boolean;
export function isTwentyFourHourTime(value: unknown): boolean;
export function isRootRelativePath(value: unknown): boolean;
export function isSafeCmsLink(value: unknown): boolean;
export function isManagedImageSource(value: unknown): boolean;
export function validateSafeLink(value?: string | null): string | undefined;
export function validateAllowedHost(
  value: string | null | undefined,
  allowedHosts: readonly string[],
  serviceName: string,
): string | undefined;
export function validateEmailAddress(value?: string | null): string | undefined;
export function validateTelephoneLink(value?: string | null): string | undefined;
export function validateTwentyFourHourTime(value?: string | null): string | undefined;
export function validateRootRelativePath(value?: string | null): string | undefined;
