import browser from 'webextension-polyfill';
import { startDomainsSync } from '@/background/domains';
import { handleEnabled } from '@/background/enable';
import { setBadgeCount } from '@/lib/badge';
import { CookieName } from '@/lib/constants';
import {
  getLocalhostCookies,
  getSessionCookies,
  getSessionCookiesForPreferredDomain,
  isEmployeeCookie,
  isUserCookie,
} from '@/lib/cookies';

const SESSION_RULE_ID = 1;

startDomainsSync();

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

  const sessionCookies = await getSessionCookies();

  const hasEmployeeCookies = sessionCookies.some(isEmployeeCookie);
  const hasUserCookies = sessionCookies.some(isUserCookie);

  setBadgeCount(hasEmployeeCookies, hasUserCookies);

  browser.cookies.onChanged.addListener(async ({ cookie, removed }) => {
    if (cookie.domain === 'localhost' || cookie.domain.endsWith('.dev.nav.no')) {
      console.debug(
        `Cookie ${removed ? 'removed' : 'changed'} for domain ${cookie.domain}: ${cookie.name}=${cookie.value}`,
      );

      // If cookies change for either localhost or .dev.nav.no, recreate the rules.
      createRules();
    }
  });

  browser.storage.sync.onChanged.addListener((changes) => {
    if (CookieName.EMPLOYEE in changes) {
      const { newValue, oldValue } = changes[CookieName.EMPLOYEE];
      console.log(`Preferred employee domain changed to ${newValue} from ${oldValue}`);
      createRules();
    } else if (CookieName.USER in changes) {
      const { newValue, oldValue } = changes[CookieName.USER];
      console.log(`Preferred user domain changed to ${newValue} from ${oldValue}`);
      createRules();
    }
  });

  createRules();

  handleEnabled();
};

init();

const createRules = async () => {
  const localhostCookies = await getLocalhostCookies();
  const { employeeCookie, userCookie } = await getSessionCookiesForPreferredDomain();

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

const URL_REGEX = /^https?:\/\/localhost:\d{4}(?:$|\/.*)/;

const stringify = (...cookies: browser.Cookies.Cookie[]): string =>
  cookies.map(({ name, value }) => `${name}=${value}`).join('; ');
