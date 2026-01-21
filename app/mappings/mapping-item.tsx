import { Icon } from '@iconify/react';
import type { Cookies } from 'webextension-polyfill';
import { Domain } from '@/app/domain';
import { CookieName, getUserCookieName } from '@/lib/constants';
import type { Mapping } from '@/lib/mappings';

interface Props {
  mapping: Mapping;
  cookies: Cookies.Cookie[];
  onDelete: () => void;
}

export const MappingItem = ({ mapping, cookies, onDelete }: Props) => {
  const hasEmployeeCookie = cookies.some((c) => c.name === CookieName.EMPLOYEE);
  const expectedUserCookieName = getUserCookieName(mapping.domain);
  const hasUserCookie = cookies.some((c) => c.name === expectedUserCookieName);
  const hasCookies = hasEmployeeCookie || hasUserCookie;

  return (
    <li
      className={`flex flex-row items-center gap-2 rounded-sm border-2 px-2 py-1 ${hasCookies ? 'border-sky-700 bg-sky-900/30' : 'border-gray-700 bg-gray-900/30 opacity-50'}`}
    >
      <div className="flex flex-col gap-0.5">
        <div className="flex flex-row items-center gap-1">
          <span className="font-mono text-sky-400 text-sm">:{mapping.port}</span>
          <Icon icon="mdi:arrow-left" className="text-gray-500" />
          <Domain>{mapping.domain}</Domain>
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
        </div>
      </div>

      <button
        type="button"
        onClick={onDelete}
        className="ml-auto cursor-pointer text-red-500 hover:text-red-700"
        title="Remove mapping"
      >
        <Icon icon="mdi:delete" />
      </button>
    </li>
  );
};
