import { handleStatus } from 'status';
import type { Cookies } from 'webextension-polyfill';
import browser from 'webextension-polyfill';
import { COOKIE_NAMES } from '@/constants';
import { handleEnabled } from '@/enable';

enum OnChangedCause {
  /** A cookie has been automatically removed due to garbage collection. */
  EVICTED = 'evicted',
  /** A cookie has been automatically removed due to expiry. */
  EXPIRED = 'expired',
  /** A cookie has been inserted or removed via an explicit call to cookies.remove(). */
  EXPLICIT = 'explicit',
  /** A cookie has been overwritten by a cookie with an already-expired expiration date. */
  EXPIRED_OVERWRITE = 'expired_overwrite',
  /** A call to cookies.set() overwrote this cookie with a different one. */
  OVERWRITE = 'overwrite',
}

browser.cookies.onChanged.addListener(({ cookie, cause }) => {
  const { name, domain } = cookie;

  console.debug(`Cookie "${name}" for ${domain} updated (${cause})`);

  if (!COOKIE_NAMES.includes(name) || domain !== 'localhost' || !domain.endsWith('.dev.nav.no')) {
    return;
  }

  if (cause === OnChangedCause.OVERWRITE) {
    setLocalhostCookie(cookie);
    return;
  }

  removeLocalhostCookie(name);
  return;
});

const copySessionCookie = async () => {
  const allCookies = await browser.cookies.getAll({});

  const sessionCookies = allCookies.filter(
    ({ domain, name }) => domain.endsWith('.dev.nav.no') && COOKIE_NAMES.includes(name),
  );

  if (sessionCookies.length === 0) {
    console.debug('No session cookies found');
    return;
  }

  for (const sessionCookie of sessionCookies) {
    setLocalhostCookie(sessionCookie);
  }
};

copySessionCookie();

const setLocalhostCookie = async ({ value, name }: Cookies.Cookie) => {
  try {
    await browser.cookies.set({ url: 'http://localhost', domain: 'localhost', secure: false, name, value });
    console.debug(`Cookie "${name}" for localhost set`);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error setting cookie "${name}" for localhost: ${error.name} - ${error.message}`);
    } else {
      console.error(`Error setting cookie "${name}" for localhost: ${error}`);
    }
  }
};

const removeLocalhostCookie = async (name: string) => {
  try {
    await browser.cookies.remove({ name, url: 'http://localhost' });
    console.debug(`Cookie "${name}" for localhost removed`);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error removing cookie "${name}" for localhost: ${error.name} - ${error.message}`);
    } else {
      console.error(`Error removing cookie "${name}" for localhost: ${error}`);
    }
  }
};

handleEnabled();

browser.action.setBadgeTextColor({ color: '#FFFFFF' });

const setBadgeCount = (count: number) => {
  browser.action.setBadgeText({ text: count.toString() });
  browser.action.setBadgeBackgroundColor({ color: count > 0 ? '#06893A' : '#C30000' });
};

handleStatus((hasEmployee, hasUser) => {
  if (hasEmployee && hasUser) {
    console.debug('Empoyee and user cookies set for localhost');
    setBadgeCount(2);
  } else if (hasEmployee) {
    console.debug('Employee cookie set for localhost');
    setBadgeCount(1);
  } else if (hasUser) {
    console.debug('User cookie set for localhost');
    setBadgeCount(1);
  } else {
    console.debug('Cookies set for localhost');
    setBadgeCount(0);
  }
});
