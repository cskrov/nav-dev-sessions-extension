export enum CookieName {
  EMPLOYEE = 'io.nais.wonderwall.session',
  USER_DEV = 'sso-dev.nav.no',
  USER_PROD = 'sso-nav.no',
}

export const COOKIE_NAMES = Object.values(CookieName);

export const isCookieName = (name: string): name is CookieName => COOKIE_NAMES.includes(name as CookieName);

export const NAV_DOMAIN_SUFFIX = '.nav.no';
export const DEV_NAV_DOMAIN_SUFFIX = '.dev.nav.no';

export const LOCALHOST = 'localhost';

/**
 * Determines if a domain is a dev domain (*.dev.nav.no).
 */
export const isDevDomain = (domain: string): boolean => domain.endsWith(DEV_NAV_DOMAIN_SUFFIX);

/**
 * Gets the user cookie name that is valid for the given domain.
 * - For dev domains (*.dev.nav.no): sso-dev.nav.no
 * - For prod domains (*.nav.no but not *.dev.nav.no): sso-nav.no
 */
export const getUserCookieName = (domain: string): CookieName.USER_DEV | CookieName.USER_PROD =>
  isDevDomain(domain) ? CookieName.USER_DEV : CookieName.USER_PROD;

/**
 * Checks if a cookie name is a valid user cookie for the given domain.
 */
export const isValidUserCookieForDomain = (cookieName: string, domain: string): boolean =>
  cookieName === getUserCookieName(domain);
