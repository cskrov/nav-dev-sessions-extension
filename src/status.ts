import browser from 'webextension-polyfill';
import { EMPLOYEE_SESSION_COOKIE_NAME, USER_SESSION_COOKIE_NAME } from '@/constants';

let hasEmployee = false;
let hasUser = false;

export const handleStatus = async (onChange: (hasEmployee: boolean, hasUser: boolean) => void) => {
  const localhostCookies = await browser.cookies.getAll({ domain: 'localhost' });

  hasEmployee = localhostCookies.some(({ name }) => name === EMPLOYEE_SESSION_COOKIE_NAME);
  hasUser = localhostCookies.some(({ name }) => name === USER_SESSION_COOKIE_NAME);

  onChange(hasEmployee, hasUser);

  browser.cookies.onChanged.addListener(({ cookie, removed }) => {
    const { domain, name, value } = cookie;

    if (domain !== 'localhost') {
      return;
    }

    hasEmployee = name === EMPLOYEE_SESSION_COOKIE_NAME ? !removed && value.length > 0 : hasEmployee;
    hasUser = name === USER_SESSION_COOKIE_NAME ? !removed && value.length > 0 : hasUser;

    onChange(hasEmployee, hasUser);
  });
};
