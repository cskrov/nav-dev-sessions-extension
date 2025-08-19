export enum CookieName {
  EMPLOYEE = 'io.nais.wonderwall.session',
  USER = 'sso-dev.nav.no',
}

export const COOKIE_NAMES = Object.values(CookieName);

export const isCookieName = (name: string): name is CookieName => COOKIE_NAMES.includes(name as CookieName);
