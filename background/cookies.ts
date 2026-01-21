import { type CookieChangeListener, cookieObserver } from '@/lib/cookie-observer';
import { isEmployeeCookie, isUserCookie, setLocalhostCookie } from '@/lib/cookies';
import { preferredEmployeeDomainObserver } from '@/lib/preferred-domain-observer';

export const startCookiesSync = () => {
  let domain: string | null = null;

  preferredEmployeeDomainObserver.addListener((newDomain) => {
    if (newDomain === domain) {
      return;
    }

    console.log('Preferred employee domain changed to', newDomain);

    if (domain !== null) {
      // If the old domain is not null, remove the listener for the old domain.
      cookieObserver.removeListener(domain, setCookies);
    }

    if (newDomain !== null) {
      // If the new domain is not null, add the listener for the new domain.
      cookieObserver.addListener(newDomain, setCookies);
    }

    // Update the current domain.
    domain = newDomain;
  });
};

const setCookies: CookieChangeListener = async (cookies) => {
  const employeeCookie = cookies.find(isEmployeeCookie);
  const userCookie = cookies.find(isUserCookie);

  if (employeeCookie !== undefined) {
    setLocalhostCookie(employeeCookie);
  }

  if (userCookie !== undefined) {
    setLocalhostCookie(userCookie);
  }
};
