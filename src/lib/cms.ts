import { withBase } from './urls';

const externalUrl = /^https?:\/\//i;
const allowedSpecialLink = /^(?:mailto:|tel:|#)/i;

export const cmsImageSource = (value?: string) => {
  if (!value) return undefined;
  if (externalUrl.test(value)) return value;
  if (value.startsWith('/') && !value.startsWith('//')) return withBase(value);
  return undefined;
};

export const cmsLink = (value?: string) => {
  if (!value) return undefined;
  if (externalUrl.test(value) || allowedSpecialLink.test(value)) return value;
  if (value.startsWith('/') && !value.startsWith('//')) return withBase(value);
  return undefined;
};
