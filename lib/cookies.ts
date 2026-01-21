import browser, { type Cookies } from 'webextension-polyfill';
import { CookieName } from '@/lib/constants';
import {
  getPreferredDomainSetting,
  onPreferredEmployeeDomainChange,
  onPreferredUserDomainChange,
} from '@/lib/preferred-domain';
import { getSortedTabDomains, onSortedTabDomains } from '@/lib/tabs';

export interface EmployeeCookie extends Cookies.Cookie {
  name: CookieName.EMPLOYEE;
}

export interface UserCookie extends Cookies.Cookie {
  name: CookieName.USER;
}

export type SessionCookie = EmployeeCookie | UserCookie;

export const onPreferredDomainCookieChange = async (
  onChange: (employeeCookie: EmployeeCookie | null, userCookie: UserCookie | null) => void,
) => {
  let preferredEmployeeDomain = await getPreferredDomainSetting(CookieName.EMPLOYEE);
  let preferredUserDomain = await getPreferredDomainSetting(CookieName.USER);

  onPreferredEmployeeDomainChange((domain) => {
    preferredEmployeeDomain = domain;
  });

  onPreferredUserDomainChange((domain) => {
    preferredUserDomain = domain;
  });

  browser.cookies.onChanged.addListener(async ({ cookie, removed }: Cookies.OnChangedChangeInfoType) => {
    if (cookie.domain === preferredEmployeeDomain || cookie.domain === preferredUserDomain) {
      console.debug(`Cookie ${removed ? 'removed' : 'changed'} for ${cookie.domain}: ${cookie.name}=${cookie.value}`);

      // If cookies change for .dev.nav.no, update localhost cookies.
      const { employeeCookie, userCookie } = await getSessionCookiesForPreferredDomain();
      onChange(employeeCookie, userCookie);
    }
  });

  // Immediate callback with initial cookies.
  const { employeeCookie, userCookie } = await getSessionCookiesForPreferredDomain();
  onChange(employeeCookie, userCookie);
};

export const getSessionCookies = async (): Promise<SessionCookie[]> => {
  const devCookies = await browser.cookies.getAll({ domain: '.dev.nav.no' });

  const sessionCookies = devCookies.filter(isSessionCookie);

  return sessionCookies;
};

export const getEmployeeAndUserCookies = async () => {
  const sessionCookies = await getSessionCookies();
  const employeeCookies = sessionCookies.filter(({ name }) => name === CookieName.EMPLOYEE);
  const userCookies = sessionCookies.filter(({ name }) => name === CookieName.USER);

  return { employeeCookies, userCookies };
};

interface PreferredDomainCookies {
  employeeCookie: EmployeeCookie | null;
  userCookie: UserCookie | null;
}

export const getSessionCookiesForPreferredDomain = async (): Promise<PreferredDomainCookies> => {
  const { employeeCookies, userCookies } = await getEmployeeAndUserCookies();

  const employeeDomain = await getPreferredOrDefaultDomain(employeeCookies, CookieName.EMPLOYEE);
  const userDomain = await getPreferredOrDefaultDomain(userCookies, CookieName.USER);

  if (employeeDomain === null && userDomain === null) {
    return { employeeCookie: null, userCookie: null };
  }

  const employeeCookie =
    employeeDomain === null
      ? null
      : (employeeCookies.find(
        (cookie): cookie is EmployeeCookie => isEmployeeCookie(cookie) && cookie.domain === employeeDomain,
      ) ?? null);

  const userCookie =
    userDomain === null
      ? null
      : (userCookies.find((cookie): cookie is UserCookie => isUserCookie(cookie) && cookie.domain === userDomain) ??
        null);

  return { employeeCookie, userCookie };
};

const getPreferredOrDefaultDomain = async (
  sessionCookies: Cookies.Cookie[],
  variant: CookieName,
): Promise<string | null> => {
  if (sessionCookies.length === 0) {
    // If no cookies are found, return null.
    return null;
  }

  const preferredDomain = await getPreferredDomainSetting(variant);

  if (preferredDomain !== null && sessionCookies.some((cookie) => cookie.domain === preferredDomain)) {
    // If the preferred domain is set and valid, return it.
    return preferredDomain;
  }

  // If the preferred domain is not set or invalid, use the first cookie's domain.
  return getDefaultDomain(variant, { sessionCookies });
};

interface DefaultInitialValues {
  sortedDomains?: string[];
  sessionCookies?: Cookies.Cookie[];
}

const getDefaultDomain = async (variant: CookieName, initialValues?: DefaultInitialValues): Promise<string | null> => {
  const activeDomains = initialValues?.sortedDomains ?? (await getSortedTabDomains()).map((tab) => tab.domain);
  const cookies = initialValues?.sessionCookies ?? (await getSessionCookies());

  for (const domain of activeDomains) {
    if (cookies.some((cookie) => cookie.domain === domain && cookie.name === variant)) {
      return domain;
    }
  }

  return null;
};

export const listenDefaultDomain = (variant: CookieName, listener: (domain: string | null) => void) => {
  onSortedTabDomains(async (tabs) => {
    const sortedDomains = tabs.map((tab) => tab.domain);
    const domain = await getDefaultDomain(variant, { sortedDomains });
    listener(domain);
  });
};

export const isSessionCookie = (cookie: Cookies.Cookie): cookie is SessionCookie =>
  isEmployeeCookie(cookie) || isUserCookie(cookie);

export const isEmployeeCookie = (cookie: Cookies.Cookie): cookie is EmployeeCookie =>
  cookie.name === CookieName.EMPLOYEE;

export const isUserCookie = (cookie: Cookies.Cookie): cookie is UserCookie => cookie.name === CookieName.USER;

export const getLocalhostCookies = async () => browser.cookies.getAll({ domain: 'localhost' });

export const setLocalhostCookie = async (cookie: SessionCookie) =>
  browser.cookies.set({
    url: 'http://localhost',
    domain: 'localhost',
    secure: false,
    name: cookie.name,
    httpOnly: true,
    value: cookie.value,
  });
