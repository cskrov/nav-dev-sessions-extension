import browser, { type Cookies } from 'webextension-polyfill';
import { startCookiesSync } from '@/background/cookies';
import { startDomainsSync } from '@/background/domains';
import { handleEnabled } from '@/background/enable';
import { setBadgeCount } from '@/lib/badge';
import type { CookieName } from '@/lib/constants';
import { cookieObserver } from '@/lib/cookie-observer';
import {
  type EmployeeCookie,
  getLocalhostCookies,
  getSessionCookiesForPreferredDomain,
  isEmployeeCookie,
  isUserCookie,
  onPreferredDomainCookieChange,
  type UserCookie,
} from '@/lib/cookies';
import { preferredEmployeeDomainObserver, preferredUserDomainObserver } from '@/lib/preferred-domain-observer';

const SESSION_RULE_ID = 1;

startCookiesSync();

startDomainsSync();

cookieObserver.addListener('kabal.intern.dev.nav.no', (cookies) => {
  console.log('Kabal cookies changed:', cookies);
});

const init = async () => {
  browser.action.setBadgeTextColor({ color: '#FFFFFF' });

  const { disabled } = await browser.storage.sync.get('disabled');

  if (disabled !== undefined && disabled === true) {
    try {
      // Remove any existing rule when extension is disabled.
      await browser.declarativeNetRequest.updateSessionRules({ removeRuleIds: [SESSION_RULE_ID] });
    } catch (error) {
      console.error(`Error creating rules: ${error}`);
    }

    return;
  }

  let preferredEmployeeDomain = await preferredEmployeeDomainObserver.getPreferredDomain();
  let preferredUserDomain = await preferredUserDomainObserver.getPreferredDomain();

  const employeeDomainCookies: Cookies.Cookie[] =
    preferredEmployeeDomain === null ? [] : await cookieObserver.getCookies(preferredEmployeeDomain);
  const userDomainCookies: Cookies.Cookie[] =
    preferredUserDomain === null ? [] : await cookieObserver.getCookies(preferredUserDomain);

  const employeeSessionCookie: EmployeeCookie | undefined = employeeDomainCookies.find(isEmployeeCookie);
  const userSessionCookie: UserCookie | undefined = userDomainCookies.find(isUserCookie);

  preferredEmployeeDomainObserver.addListener((domain) => {
    preferredEmployeeDomain = domain;
  });

  preferredUserDomainObserver.addListener((domain) => {
    preferredUserDomain = domain;
  });

  setBadgeCount(employeeSessionCookie !== undefined, userSessionCookie !== undefined);

  onPreferredDomainCookieChange(createRules);

  // browser.storage.sync.onChanged.addListener(async (changes) => {
  //   if (CookieName.EMPLOYEE in changes) {
  //     const { newValue, oldValue } = changes[CookieName.EMPLOYEE];
  //     console.log(`Preferred employee domain changed to ${newValue} from ${oldValue}`);
  //     const { employeeCookie, userCookie } = await getSessionCookiesForPreferredDomain();
  //     createRules(employeeCookie, userCookie);
  //   } else if (CookieName.USER in changes) {
  //     const { newValue, oldValue } = changes[CookieName.USER];
  //     console.log(`Preferred user domain changed to ${newValue} from ${oldValue}`);
  //     const { employeeCookie, userCookie } = await getSessionCookiesForPreferredDomain();
  //     createRules(employeeCookie, userCookie);
  //   }
  // });

  const { employeeCookie, userCookie } = await getSessionCookiesForPreferredDomain();
  createRules(employeeCookie, userCookie);

  handleEnabled();
};

const createRules = async (employeeCookie: EmployeeCookie | null, userCookie: UserCookie | null) => {
  const localhostCookies = await getLocalhostCookies();

  console.log('Employee cookie:', employeeCookie);
  console.log('User cookie:', userCookie);
  console.log(`Local cookies:`, localhostCookies);

  const cookies = localhostCookies.concat(employeeCookie ?? [], userCookie ?? []);

  const rule: browser.DeclarativeNetRequest.Rule = {
    id: SESSION_RULE_ID,
    action: {
      type: 'modifyHeaders',
      requestHeaders: [
        {
          header: 'Cookie',
          operation: 'set',
          value: stringify(...cookies),
        },
        {
          header: 'X-Nav-Dev-Sessions-Extension',
          operation: 'set',
          value: [employeeCookie?.name, userCookie?.name].filter((n): n is CookieName => n !== undefined).join(', '),
        },
      ],
    },
    condition: { initiatorDomains: ['localhost'], requestDomains: ['localhost'], regexFilter: URL_REGEX.source },
    priority: 10,
  };

  try {
    await browser.declarativeNetRequest.updateSessionRules({ removeRuleIds: [SESSION_RULE_ID], addRules: [rule] });

    console.log('Created rule:', rule);
  } catch (error) {
    console.error(`Error creating rules: ${error}`);
  }
};

const URL_REGEX = /^(?:https?|wss?):\/\/localhost:\d{4}(?:$|\/.*)/;

const stringify = (...cookies: browser.Cookies.Cookie[]): string =>
  cookies.map(({ name, value }) => `${name}=${value}`).join('; ');

init();
