import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { Cookies } from 'webextension-polyfill';
import { Disable } from '@/app/disable';
import { Sessions } from '@/app/sessions/sessions';
import { Tag } from '@/app/tag';
import { setBadgeCount } from '@/lib/badge';
import { onSessionCookiesChange } from '@/lib/status';

const Popup = () => {
  const [employeeCookies, setEmployeeCookies] = useState<Cookies.Cookie[]>([]);
  const [userCookies, setUserCookies] = useState<Cookies.Cookie[]>([]);

  const hasEmployeeCookies = employeeCookies.length !== 0;
  const hasUserCookies = userCookies.length !== 0;

  useEffect(() => {
    onSessionCookiesChange((e, u) => {
      setEmployeeCookies(e);
      setUserCookies(u);
    });
  }, []);

  useEffect(() => {
    setBadgeCount(hasEmployeeCookies, hasUserCookies);
  }, [hasEmployeeCookies, hasUserCookies]);

  return (
    <>
      <div className="mb-2 flex flex-row items-start gap-2 whitespace-nowrap">
        <h1 className="font-bold">Nav Dev Sessions Extension</h1>
        <Disable className="ml-auto" />
      </div>

      <p className="mb-4 text-sm italic">
        Extension that adds session cookies from <Tag>*.dev.nav.no</Tag> to requests to <Tag>localhost</Tag>.
      </p>

      <Sessions
        userCookies={userCookies}
        employeeCookies={employeeCookies}
        hasUserCookies={hasUserCookies}
        hasEmployeeCookies={hasEmployeeCookies}
      />

      <hr className="my-4" />

      <section className="flex flex-col gap-2 text-sm italic">
        <p>
          It is recommended to have both <Tag>dev</Tag> and <Tag>localhost</Tag> open at the same time.
        </p>

        <p>
          This extension only affects requests made to <Tag>localhost</Tag> with a 4 digit port.
        </p>
        <p>
          Example: <Tag>localhost:3000</Tag>
        </p>

        <p>
          Source code:{' '}
          <a
            href="https://github.com/cskrov/nav-dev-sessions-extension"
            target="_blank"
            className="underline hover:text-blue-500"
            rel="noopener"
          >
            GitHub
          </a>
        </p>
      </section>
    </>
  );
};

const root = document.getElementById('root');

if (root === null) {
  throw new Error('Failed to find the root element');
}

createRoot(root).render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>,
);
