import { Icon } from '@iconify/react';
import { useEffect, useState } from 'react';
import type { Cookies } from 'webextension-polyfill';
import { Domain, EnvironmentBadge } from '@/app/domain';
import { CookieName, getUserCookieName } from '@/lib/constants';
import { cookieObserver } from '@/lib/cookie-observer';
import { domainsObserver } from '@/lib/domains-observer';

interface Props {
  onSelectDomain: (domain: string) => void;
  excludeDomains?: string[];
}

export const DomainSelector = ({ onSelectDomain, excludeDomains = [] }: Props) => {
  const [domains, setDomains] = useState<string[]>([]);
  const [cookiesMap, setCookiesMap] = useState<Map<string, Cookies.Cookie[]>>(new Map());

  useEffect(() => {
    domainsObserver.getDomains().then(setDomains);
    const unsubscribe = domainsObserver.addListener(setDomains);
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    for (const domain of domains) {
      const unsubscribe = cookieObserver.addListener(domain, (cookies) => {
        setCookiesMap((prev) => {
          const next = new Map(prev);
          next.set(domain, cookies);
          return next;
        });
      });
      unsubscribers.push(unsubscribe);
    }

    return () => {
      for (const unsubscribe of unsubscribers) {
        unsubscribe();
      }
    };
  }, [domains]);

  const excludeSet = new Set(excludeDomains);
  const availableDomains = domains.filter((d) => !excludeSet.has(d));

  if (availableDomains.length === 0) {
    return <p className="text-gray-400 text-sm italic">No domains available. Log in to a *.nav.no site first.</p>;
  }

  return (
    <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto" tabIndex={-1}>
      {availableDomains
        .map((domain) => {
          const cookies = cookiesMap.get(domain) ?? [];
          const hasEmployeeCookie = cookies.some((c) => c.name === CookieName.EMPLOYEE);
          const expectedUserCookieName = getUserCookieName(domain);
          const hasUserCookie = cookies.some((c) => c.name === expectedUserCookieName);
          const hasCookies = hasEmployeeCookie || hasUserCookie;
          return { domain, hasEmployeeCookie, hasUserCookie, hasCookies };
        })
        .toSorted((a, b) => {
          if (a.hasCookies && !b.hasCookies) {
            return -1;
          }
          if (!a.hasCookies && b.hasCookies) {
            return 1;
          }
          return a.domain.localeCompare(b.domain);
        })
        .map(({ domain, hasEmployeeCookie, hasUserCookie, hasCookies }) => {
          return (
            <li key={domain}>
              <button
                type="button"
                onClick={() => onSelectDomain(domain)}
                className={`flex w-full cursor-pointer flex-col gap-0.5 rounded-sm border-2 border-gray-600 px-2 py-1 text-left transition-colors hover:border-gray-500 focus:border-sky-500 focus:bg-sky-900/50 focus:outline-none focus:hover:border-sky-400 ${
                  hasCookies ? 'opacity-100' : 'opacity-50'
                }`}
              >
                <Domain>{domain}</Domain>
                <div className="flex flex-row items-center gap-2 text-xs">
                  <span
                    className={`flex items-center gap-0.5 ${hasEmployeeCookie ? 'text-green-400' : 'text-gray-500'}`}
                  >
                    <Icon icon="mdi:work" />
                    <span>Ansatt</span>
                  </span>
                  <span className={`flex items-center gap-0.5 ${hasUserCookie ? 'text-green-400' : 'text-gray-500'}`}>
                    <Icon icon="mdi:person-circle" />
                    <span>Bruker</span>
                  </span>
                  <EnvironmentBadge domain={domain} />
                </div>
              </button>
            </li>
          );
        })}
    </ul>
  );
};
