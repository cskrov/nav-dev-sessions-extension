import { Icon } from '@iconify/react';
import type { Cookies } from 'webextension-polyfill';
import { Session } from '@/app/sessions/session';
import { CookieName } from '@/lib/constants';

interface Props {
  userCookies: Cookies.Cookie[];
  employeeCookies: Cookies.Cookie[];
  hasUserCookies: boolean;
  hasEmployeeCookies: boolean;
}

export const Sessions = ({ userCookies, employeeCookies, hasUserCookies, hasEmployeeCookies }: Props) => (
  <section>
    <h1 className="mb-2 font-bold text-base">Sessions</h1>

    <ul className="flex flex-col gap-1 whitespace-nowrap">
      <Session
        exists={hasUserCookies}
        icon={<Icon icon="mdi:person-circle" />}
        cookies={userCookies}
        variant={CookieName.USER}
      >
        Bruker
      </Session>

      <Session
        exists={hasEmployeeCookies}
        icon={<Icon icon="mdi:work" />}
        cookies={employeeCookies}
        variant={CookieName.EMPLOYEE}
      >
        Ansatt
      </Session>
    </ul>
  </section>
);
