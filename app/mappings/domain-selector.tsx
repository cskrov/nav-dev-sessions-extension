import { Icon } from '@iconify/react';
import { useEffect, useState } from 'react';
import type { Cookies } from 'webextension-polyfill';
import { Domain, EnvironmentBadge } from '@/app/domain';
import { CookieName, getUserCookieName } from '@/lib/constants';
import { cookieObserver } from '@/lib/cookie-observer';
import { domainsObserver } from '@/lib/domains-observer';

interface Props {
  selectedDomain: string | null;
  onSelectDomain: (domain: string) => void;
  excludeDomains?: string[];
}

export const DomainSelector = ({ selectedDomain, onSelectDomain, excludeDomains = [] }: Props) => {
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
    return <p className="text-gray-400 text-sm italic">No domains available. Visit a *.nav.no site first.</p>;
  }

  return (
    <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto">
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
          const isSelected = selectedDomain === domain;

          return (
            <li key={domain}>
              <button
                type="button"
                onClick={() => onSelectDomain(domain)}
                className={`flex w-full cursor-pointer flex-col gap-0.5 rounded-sm border-2 px-2 py-1 text-left transition-colors ${
                  isSelected
                    ? 'border-sky-500 bg-sky-900/50'
                    : hasCookies
                      ? 'border-gray-600 hover:border-gray-500'
                      : 'border-gray-700 opacity-50 hover:border-gray-600'
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
