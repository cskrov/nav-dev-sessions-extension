import { Icon } from '@iconify/react';
import { useEffect, useState } from 'react';
import type { Cookies } from 'webextension-polyfill';
import { AddButton } from '@/app/add-button';
import { Button } from '@/app/button';
import { Domain, EnvironmentBadge } from '@/app/domain';
import { PageContainer } from '@/app/page-container';
import { PageHeader } from '@/app/page-header';
import { CookieName, getUserCookieName } from '@/lib/constants';
import { cookieObserver } from '@/lib/cookie-observer';
import { type Mapping, onMappingsChange, removeMapping, setActiveMapping } from '@/lib/mappings';

interface Props {
  port: number;
  onBack: () => void;
  onAddNew: () => void;
}

export const EditMappingPage = ({ port, onBack, onAddNew }: Props) => {
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [cookiesMap, setCookiesMap] = useState<Map<string, Cookies.Cookie[]>>(new Map());

  useEffect(() => {
    return onMappingsChange((allMappings) => {
      const portMappings = allMappings.filter((m) => m.port === port);
      setMappings(portMappings);
    });
  }, [port]);

  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    for (const mapping of mappings) {
      const unsubscribe = cookieObserver.addListener(mapping.domain, (cookies) => {
        setCookiesMap((prev) => {
          const next = new Map(prev);
          next.set(mapping.domain, cookies);
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
  }, [mappings]);

  const handleSetActive = (domain: string) => {
    setActiveMapping(port, domain);
  };

  const handleDelete = (domain: string) => {
    removeMapping(port, domain);
  };

  const handleDeleteAll = async () => {
    for (const mapping of mappings) {
      await removeMapping(port, mapping.domain);
    }
    onBack();
  };

  // Sort alphabetically by domain for stable ordering
  const sortedMappings = mappings.toSorted((a, b) => a.domain.localeCompare(b.domain));

  return (
    <PageContainer>
      <PageHeader
        onBack={onBack}
        action={
          <button
            type="button"
            onClick={handleDeleteAll}
            className="cursor-pointer text-red-500 hover:text-red-700"
            title="Delete mapping"
          >
            <Icon icon="mdi:delete" className="text-xl" />
          </button>
        }
      >
        Edit <span className="font-mono text-gray-400">localhost</span>
        <span className="font-mono text-sky-400">:{port}</span>
      </PageHeader>

      <p className="text-gray-400 text-sm">Select which domain to use for this port:</p>

      <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto">
        {sortedMappings.map((mapping) => {
          const cookies = cookiesMap.get(mapping.domain) ?? [];
          const hasEmployeeCookie = cookies.some((c) => c.name === CookieName.EMPLOYEE);
          const expectedUserCookieName = getUserCookieName(mapping.domain);
          const hasUserCookie = cookies.some((c) => c.name === expectedUserCookieName);
          const hasCookies = hasEmployeeCookie || hasUserCookie;
          const isActive = mapping.active;

          return (
            <li key={mapping.domain} className="flex flex-row items-center gap-2">
              <button
                type="button"
                onClick={() => handleSetActive(mapping.domain)}
                className={`flex grow cursor-pointer flex-row items-center gap-2 rounded-md border-2 px-2 py-1 text-left transition-colors ${
                  isActive
                    ? 'border-sky-500 bg-sky-900/50'
                    : hasCookies
                      ? 'border-gray-600 hover:border-gray-500'
                      : 'border-gray-700 opacity-50 hover:border-gray-600'
                }`}
              >
                <Icon
                  icon={isActive ? 'mdi:radiobox-marked' : 'mdi:radiobox-blank'}
                  className={`shrink-0 text-lg ${isActive ? 'text-sky-400' : 'text-gray-500'}`}
                />
                <div className="flex flex-col gap-0.5">
                  <Domain>{mapping.domain}</Domain>
                  <div className="flex flex-row items-center gap-2 text-xs">
                    <span
                      className={`flex items-center gap-0.5 ${hasEmployeeCookie ? 'text-green-400' : 'text-gray-500'}`}
                      title={hasEmployeeCookie ? 'Employee cookie available' : 'No employee cookie'}
                    >
                      <Icon icon="mdi:work" />
                      <span>Ansatt</span>
                    </span>
                    <span
                      className={`flex items-center gap-0.5 ${hasUserCookie ? 'text-green-400' : 'text-gray-500'}`}
                      title={hasUserCookie ? 'User cookie available' : 'No user cookie'}
                    >
                      <Icon icon="mdi:person-circle" />
                      <span>Bruker</span>
                    </span>
                    <EnvironmentBadge domain={mapping.domain} />
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleDelete(mapping.domain)}
                className="cursor-pointer text-red-500 hover:text-red-700"
                title="Remove mapping"
              >
                <Icon icon="mdi:delete" />
              </button>
            </li>
          );
        })}
        <li className="flex flex-row items-center gap-2">
          <AddButton onClick={onAddNew}>Add domain</AddButton>
          <div className="w-4" />
        </li>
      </ul>

      <div className="flex flex-row justify-end">
        <Button onClick={onBack} className="rounded-sm">
          Done
        </Button>
      </div>
    </PageContainer>
  );
};
