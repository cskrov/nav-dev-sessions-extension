import browser, { type Cookies } from 'webextension-polyfill';
import { isCookieName } from '@/lib/constants';
import { getEmployeeAndUserCookies } from '@/lib/cookies';

export const onSessionCookiesChange = async (
  onChange: (employeeCookies: Cookies.Cookie[], userCookies: Cookies.Cookie[]) => void,
) => {
  const { employeeCookies, userCookies } = await getEmployeeAndUserCookies();

  onChange(employeeCookies, userCookies);

  browser.cookies.onChanged.addListener(async ({ cookie }) => {
    const { domain, name } = cookie;

    if (!domain.endsWith('.dev.nav.no') || !isCookieName(name)) {
      // Change not relevant.
      return;
    }

    const { employeeCookies, userCookies } = await getEmployeeAndUserCookies();

    onChange(employeeCookies, userCookies);
  });
};
