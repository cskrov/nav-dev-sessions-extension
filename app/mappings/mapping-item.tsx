import { Icon } from '@iconify/react';
import type { Cookies } from 'webextension-polyfill';
import { Badge } from '@/app/badge';
import { Domain, EnvironmentBadge } from '@/app/domain';
import { CookieName, getUserCookieName } from '@/lib/constants';
import type { Mapping } from '@/lib/mappings';

interface Props {
  activeMapping: Mapping;
  alternativeCount: number;
  cookies: Cookies.Cookie[];
  onClick: () => void;
}

export const MappingItem = ({ activeMapping, alternativeCount, cookies, onClick }: Props) => {
  const hasEmployeeCookie = cookies.some((c) => c.name === CookieName.EMPLOYEE);
  const expectedUserCookieName = getUserCookieName(activeMapping.domain);
  const hasUserCookie = cookies.some((c) => c.name === expectedUserCookieName);
  const hasCookies = hasEmployeeCookie || hasUserCookie;

  return (
    <li
      className={`flex flex-row items-center gap-2 rounded-md border-2 px-2 py-1 ${
        hasCookies ? 'border-sky-700 bg-sky-900/30' : 'border-gray-700 bg-gray-900/30 opacity-50'
      }`}
    >
      <button
        type="button"
        onClick={onClick}
        className="flex grow cursor-pointer flex-row items-center gap-2 text-left"
      >
        <div className="flex grow flex-col gap-0.5">
          <div className="flex flex-row items-center gap-1">
            <span className="font-mono text-sky-400 text-sm">:{activeMapping.port}</span>
            <Icon icon="mdi:arrow-left" className="text-gray-500" />
            <Domain>{activeMapping.domain}</Domain>
          </div>

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
            <EnvironmentBadge domain={activeMapping.domain} />
          </div>
        </div>
        <div className="flex flex-row items-center gap-1">
          {alternativeCount > 0 ? <Badge>+{alternativeCount}</Badge> : null}
          <Icon icon="mdi:chevron-right" className="text-gray-500 text-xl" />
        </div>
      </button>
    </li>
  );
};
