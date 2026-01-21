import { Icon } from '@iconify/react';
import { useEffect, useState } from 'react';
import type { Cookies } from 'webextension-polyfill';
import { Button } from '@/app/button';
import { Domain } from '@/app/domain';
import { CookieName, getUserCookieName } from '@/lib/constants';
import { cookieObserver } from '@/lib/cookie-observer';
import { devDomainsObserver } from '@/lib/dev-domains-observer';
import { addMapping, getMappings, type Mapping } from '@/lib/mappings';

interface Props {
  onBack: () => void;
}

export const AddMappingPage = ({ onBack }: Props) => {
  const [domains, setDomains] = useState<string[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [port, setPort] = useState<string>('3000');
  const [cookiesMap, setCookiesMap] = useState<Map<string, Cookies.Cookie[]>>(new Map());
  const [existingMappings, setExistingMappings] = useState<Mapping[]>([]);
  const [portWarning, setPortWarning] = useState<string | null>(null);

  useEffect(() => {
    devDomainsObserver.getDomains().then(setDomains);
    const unsubscribe = devDomainsObserver.addListener(setDomains);
    return unsubscribe;
  }, []);

  useEffect(() => {
    getMappings().then(setExistingMappings);
  }, []);

  useEffect(() => {
    const portNumber = Number.parseInt(port, 10);

    if (Number.isNaN(portNumber)) {
      setPortWarning(null);
      return;
    }

    const existingMapping = existingMappings.find((m) => m.port === portNumber);

    if (existingMapping !== undefined) {
      setPortWarning(`Port ${portNumber} is already mapped to ${existingMapping.domain}. It will be overwritten.`);
    } else {
      setPortWarning(null);
    }
  }, [port, existingMappings]);

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

  const handleSubmit = async () => {
    if (selectedDomain === null || port === '') {
      return;
    }

    const portNumber = Number.parseInt(port, 10);

    if (Number.isNaN(portNumber) || portNumber < 1 || portNumber > 65535) {
      return;
    }

    await addMapping({ domain: selectedDomain, port: portNumber });
    onBack();
  };

  const isValidPort = port !== '' && !Number.isNaN(Number.parseInt(port, 10));
  const canSubmit = selectedDomain !== null && isValidPort;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row items-center gap-2">
        <button type="button" onClick={onBack} className="cursor-pointer text-gray-400 hover:text-white" title="Back">
          <Icon icon="mdi:arrow-left" className="text-xl" />
        </button>
        <h2 className="font-bold text-base">Add Mapping</h2>
      </div>

      <h3>Map session cookies to ...</h3>

      <label className="inline-flex w-fit flex-row items-center rounded-sm border border-gray-600 bg-gray-800 focus-within:border-sky-500">
        <span className="py-1 pl-2 font-mono text-gray-400 text-md">localhost:</span>
        <input
          type="number"
          value={port}
          onChange={(e) => setPort(e.target.value)}
          placeholder="3000"
          className="w-20 appearance-none bg-transparent py-1 pr-2 font-mono text-md text-white focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          min="1"
          max="65535"
        />
      </label>

      {portWarning !== null && <p className="text-sm text-yellow-400">{portWarning}</p>}

      <h3>... from domain</h3>

      {domains.length === 0 ? (
        <p className="text-gray-400 text-sm italic">No domains available. Visit a *.nav.no site first.</p>
      ) : (
        <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto">
          {domains
            .toSorted((a, b) => a.localeCompare(b))
            .map((domain) => {
              const cookies = cookiesMap.get(domain) ?? [];
              const hasEmployeeCookie = cookies.some((c) => c.name === CookieName.EMPLOYEE);
              const expectedUserCookieName = getUserCookieName(domain);
              const hasUserCookie = cookies.some((c) => c.name === expectedUserCookieName);
              const hasCookies = hasEmployeeCookie || hasUserCookie;
              const isSelected = selectedDomain === domain;

              return (
                <li key={domain}>
                  <button
                    type="button"
                    onClick={() => setSelectedDomain(domain)}
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
                      <span
                        className={`flex items-center gap-0.5 ${hasUserCookie ? 'text-green-400' : 'text-gray-500'}`}
                      >
                        <Icon icon="mdi:person-circle" />
                        <span>Bruker</span>
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
        </ul>
      )}

      <div className="flex flex-row justify-end gap-2">
        <Button onClick={onBack} className="rounded-sm bg-gray-600 hover:bg-gray-500">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`rounded-sm ${canSubmit ? '' : 'cursor-not-allowed opacity-50'}`}
        >
          Add Mapping
        </Button>
      </div>
    </div>
  );
};
