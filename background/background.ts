import browser, { type Cookies } from 'webextension-polyfill';
import { startCookiesSync } from '@/background/cookies';
import { handleEnabled } from '@/background/enable';
import { setBadgeCount } from '@/lib/badge';
import { CookieName, getUserCookieName, LOCALHOST, NAV_DOMAIN_SUFFIX } from '@/lib/constants';
import { cookieObserver } from '@/lib/cookie-observer';
import { domainsObserver } from '@/lib/domains-observer';
import { getMappings, type Mapping, onMappingsChange } from '@/lib/mappings';

startCookiesSync();

// Initialize dev domains observer to track visited domains
domainsObserver.getDomains().then((domains) => {
  console.log('Initial dev domains:', domains);
});

interface MappingCookies {
  mapping: Mapping;
  employeeCookie: Cookies.Cookie | null;
  userCookie: Cookies.Cookie | null;
}

const init = async () => {
  browser.action.setBadgeTextColor({ color: '#FFFFFF' });

  const { disabled } = await browser.storage.sync.get('disabled');

  if (disabled === true) {
    try {
      await browser.declarativeNetRequest.updateSessionRules({
        removeRuleIds: await getCurrentRuleIds(),
      });
    } catch (error) {
      console.error(`Error removing rules: ${error}`);
    }
    return;
  }

  // Listen for mapping changes
  onMappingsChange(async (mappings) => {
    await updateRulesForMappings(mappings);
  });

  // Listen for cookie changes on dev domains
  browser.cookies.onChanged.addListener(async ({ cookie, removed }) => {
    if (cookie.domain.endsWith(NAV_DOMAIN_SUFFIX)) {
      console.debug(`Cookie ${removed ? 'removed' : 'changed'} for ${cookie.domain}: ${cookie.name}=${cookie.value}`);
      const mappings = await getMappings();
      await updateRulesForMappings(mappings);
    }
  });

  // Initial setup
  const mappings = await getMappings();
  await updateRulesForMappings(mappings);

  handleEnabled();
};

const getCurrentRuleIds = async (): Promise<number[]> => {
  const rules = await browser.declarativeNetRequest.getSessionRules();
  return rules.map((r) => r.id);
};

const updateRulesForMappings = async (mappings: Mapping[]) => {
  const existingRuleIds = await getCurrentRuleIds();

  // Get cookies for each mapping
  const mappingCookies: MappingCookies[] = await Promise.all(
    mappings.map(async (mapping) => {
      const cookies = await cookieObserver.getCookies(mapping.domain);
      const employeeCookie = cookies.find((c) => c.name === CookieName.EMPLOYEE) ?? null;
      const expectedUserCookieName = getUserCookieName(mapping.domain);
      const userCookie = cookies.find((c) => c.name === expectedUserCookieName) ?? null;
      return { mapping, employeeCookie, userCookie };
    }),
  );

  // Update badge count based on any active cookies
  const hasEmployeeCookie = mappingCookies.some((mc) => mc.employeeCookie !== null);
  const hasUserCookie = mappingCookies.some((mc) => mc.userCookie !== null);
  setBadgeCount(hasEmployeeCookie, hasUserCookie);

  // Create rules for each mapping
  const rules: browser.DeclarativeNetRequest.Rule[] = [];

  for (const { mapping, employeeCookie, userCookie } of mappingCookies) {
    if (employeeCookie === null && userCookie === null) {
      // No cookies for this mapping, skip rule creation
      continue;
    }

    // Use firstPartyDomain: null for Firefox compatibility (First-Party Isolation)
    const localhostCookies = await browser.cookies.getAll({ domain: LOCALHOST, firstPartyDomain: null });
    const allCookies = localhostCookies.concat(
      employeeCookie !== null ? [employeeCookie] : [],
      userCookie !== null ? [userCookie] : [],
    );

    const cookieNames = [employeeCookie?.name, userCookie?.name].filter((n): n is CookieName => n !== undefined);

    const rule: browser.DeclarativeNetRequest.Rule = {
      id: mapping.port, // Use port as rule ID for uniqueness
      action: {
        type: 'modifyHeaders',
        requestHeaders: [
          {
            header: 'Cookie',
            operation: 'set',
            value: stringify(...allCookies),
          },
          {
            header: 'Nav-Dev-Sessions-Extension',
            operation: 'set',
            value: cookieNames.join(', '),
          },
        ],
      },
      condition: {
        requestDomains: [LOCALHOST],
        regexFilter: `^(?:https?|wss?)://localhost:${mapping.port}(?:$|/.*)`,
        resourceTypes: [
          'main_frame',
          'sub_frame',
          'xmlhttprequest',
          'websocket',
          'script',
          'stylesheet',
          'image',
          'font',
          'media',
          'ping',
          'other',
        ],
      },
      priority: 10,
    };

    rules.push(rule);
  }

  try {
    await browser.declarativeNetRequest.updateSessionRules({
      removeRuleIds: existingRuleIds,
      addRules: rules,
    });

    console.log('Updated rules:', rules);
  } catch (error) {
    console.error(`Error updating rules: ${error}`);
  }
};

const stringify = (...cookies: Cookies.Cookie[]): string =>
  cookies.map(({ name, value }) => `${name}=${value}`).join('; ');

init();
