import browser, { type Cookies } from 'webextension-polyfill';
import { startCookiesSync } from '@/background/cookies';
import { handleEnabled } from '@/background/enable';
import { clearBadge, setBadgeCount } from '@/lib/badge';
import {
  CookieName,
  EXTERNAL_DOMAINS_DEV,
  EXTERNAL_DOMAINS_PROD,
  getAllCookies,
  getUserCookieName,
  isDevDomain,
  LOCALHOST,
  NAV_DOMAIN_SUFFIX,
} from '@/lib/constants';
import { cookieObserver } from '@/lib/cookie-observer';
import { domainsObserver } from '@/lib/domains-observer';
import { setIconEnabled } from '@/lib/icon';
import { getActiveMappings, type Mapping, onMappingsChange } from '@/lib/mappings';

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

// Store cleanup functions for listeners that need to be removed when disabled
let cleanupFunctions: (() => void)[] = [];
let isInitialized = false;

const getCurrentRuleIds = async (): Promise<number[]> => {
  const rules = await browser.declarativeNetRequest.getSessionRules();
  return rules.map((r) => r.id);
};

const updateRulesForMappings = async (allMappings: Mapping[]) => {
  // Only use active mappings for rules
  const mappings = allMappings.filter((m) => m.active);
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

  // Update badge count based on mappings with at least one active cookie
  const mappingsWithCookies = mappingCookies.filter(
    (mc) => mc.employeeCookie !== null || mc.userCookie !== null,
  ).length;
  setBadgeCount(mappingsWithCookies);

  // Create rules for each mapping
  const rules: browser.DeclarativeNetRequest.Rule[] = [];

  for (const { mapping, employeeCookie, userCookie } of mappingCookies) {
    if (employeeCookie === null && userCookie === null) {
      // No cookies for this mapping, skip rule creation
      continue;
    }

    const localhostCookies = await getAllCookies({ domain: LOCALHOST });
    const allCookies = localhostCookies.concat(
      employeeCookie !== null ? [employeeCookie] : [],
      userCookie !== null ? [userCookie] : [],
    );

    const cookieNames = [employeeCookie?.name, userCookie?.name].filter((n): n is CookieName => n !== undefined);

    const otherResourceTypes: browser.DeclarativeNetRequest.ResourceType[] = [
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
    ];

    const requestHeaders: browser.DeclarativeNetRequest.RuleActionRequestHeadersItemType[] = [
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
    ];

    // Rule for localhost main_frame requests (initial page load, no initiator restriction for SSR support)
    const localhostMainFrameRule: browser.DeclarativeNetRequest.Rule = {
      id: mapping.port, // Use port as rule ID for uniqueness
      action: {
        type: 'modifyHeaders',
        requestHeaders,
      },
      condition: {
        requestDomains: [LOCALHOST],
        regexFilter: `^(?:https?|wss?)://localhost:${mapping.port}(?:$|/.*)`,
        resourceTypes: ['main_frame'],
      },
      priority: 10,
    };

    rules.push(localhostMainFrameRule);

    // Rule for localhost non-main_frame requests (XHR, fetch, etc. - require localhost initiator)
    const localhostOtherRule: browser.DeclarativeNetRequest.Rule = {
      id: mapping.port + 50000, // Offset to ensure unique rule ID
      action: {
        type: 'modifyHeaders',
        requestHeaders,
      },
      condition: {
        requestDomains: [LOCALHOST],
        initiatorDomains: [LOCALHOST],
        regexFilter: `^(?:https?|wss?)://localhost:${mapping.port}(?:$|/.*)`,
        resourceTypes: otherResourceTypes,
      },
      priority: 10,
    };

    rules.push(localhostOtherRule);

    // Rules for external domain requests initiated from localhost
    // Use port + (index + 1) * 100000 offset to ensure unique rule IDs
    const externalDomains = isDevDomain(mapping.domain) ? EXTERNAL_DOMAINS_DEV : EXTERNAL_DOMAINS_PROD;

    for (const [index, externalDomain] of externalDomains.entries()) {
      const externalRule: browser.DeclarativeNetRequest.Rule = {
        id: mapping.port + (index + 1) * 100000,
        action: {
          type: 'modifyHeaders',
          requestHeaders,
          responseHeaders: [
            {
              header: 'Access-Control-Allow-Origin',
              operation: 'set',
              value: `http://localhost:${mapping.port}`,
            },
            {
              header: 'Access-Control-Allow-Credentials',
              operation: 'set',
              value: 'true',
            },
          ],
        },
        condition: {
          requestDomains: [externalDomain],
          initiatorDomains: [LOCALHOST],
          resourceTypes: otherResourceTypes,
        },
        priority: 10,
      };

      rules.push(externalRule);
    }
  }

  // Deduplicate rules by ID (last one wins)
  const deduplicatedRules = [...new Map(rules.map((r) => [r.id, r])).values()];

  // Include new rule IDs in removeRuleIds to avoid "not unique" errors from race conditions
  const newRuleIds = deduplicatedRules.map((r) => r.id);
  const allRemoveIds = [...new Set([...existingRuleIds, ...newRuleIds])];

  try {
    await browser.declarativeNetRequest.updateSessionRules({
      removeRuleIds: allRemoveIds,
      addRules: deduplicatedRules,
    });

    console.log('Updated rules:', deduplicatedRules);
  } catch (error) {
    console.error(`Error updating rules: ${error}`);
  }
};

const stringify = (...cookies: Cookies.Cookie[]): string =>
  cookies.map(({ name, value }) => `${name}=${value}`).join('; ');

const cleanup = async () => {
  // Run all cleanup functions
  for (const cleanupFn of cleanupFunctions) {
    cleanupFn();
  }
  cleanupFunctions = [];
  isInitialized = false;

  // Clear badge when disabled
  clearBadge();

  // Set greyed-out icon when disabled
  setIconEnabled(false);

  // Remove all rules
  try {
    await browser.declarativeNetRequest.updateSessionRules({
      removeRuleIds: await getCurrentRuleIds(),
    });
  } catch (error) {
    console.error(`Error removing rules: ${error}`);
  }
};

const setupListeners = async () => {
  if (isInitialized) {
    return;
  }
  isInitialized = true;

  // Listen for mapping changes
  const unsubscribeMappings = onMappingsChange(async (mappings) => {
    await updateRulesForMappings(mappings);
  });
  cleanupFunctions.push(unsubscribeMappings);

  // Listen for cookie changes on dev domains
  const cookieListener = async ({ cookie, removed }: browser.Cookies.OnChangedChangeInfoType) => {
    if (cookie.domain.endsWith(NAV_DOMAIN_SUFFIX)) {
      console.debug(`Cookie ${removed ? 'removed' : 'changed'} for ${cookie.domain}: ${cookie.name}=${cookie.value}`);
      const mappings = await getActiveMappings();
      await updateRulesForMappings(mappings);
    }
  };
  browser.cookies.onChanged.addListener(cookieListener);
  cleanupFunctions.push(() => browser.cookies.onChanged.removeListener(cookieListener));

  // Set normal icon when enabled
  setIconEnabled(true);

  // Initial setup
  const mappings = await getActiveMappings();
  await updateRulesForMappings(mappings);

  handleEnabled();
};

const init = async () => {
  browser.action.setBadgeTextColor({ color: '#FFFFFF' });

  // Handle initial state
  const { disabled } = await browser.storage.sync.get('disabled');

  if (disabled !== true) {
    await setupListeners();
  } else {
    // Ensure rules are cleared when starting disabled
    await cleanup();
  }

  // Listen for disabled state changes
  browser.storage.sync.onChanged.addListener(async (changes) => {
    if ('disabled' in changes) {
      const isDisabled = changes.disabled.newValue === true;

      if (isDisabled) {
        console.log('Extension disabled, cleaning up...');
        await cleanup();
      } else {
        console.log('Extension enabled, setting up listeners...');
        await setupListeners();
      }
    }
  });
};

init();
