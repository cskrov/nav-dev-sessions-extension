import { Icon } from '@iconify/react';
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { handleStatus } from 'status';
import { EMPLOYEE_SESSION_COOKIE_NAME, USER_SESSION_COOKIE_NAME } from '@/constants';

const Popup = () => {
  const [hasEmployee, setHasEmployee] = useState(false);
  const [hasUser, setHasUser] = useState(false);

  useEffect(() => {
    handleStatus((e, u) => {
      setHasEmployee(e);
      setHasUser(u);
    });
  }, []);

  return (
    <ul className="flex shrink-0 flex-col gap-1 whitespace-nowrap">
      <Session copied={hasUser} icon={<Icon icon="mdi:person-circle" />} tag={USER_SESSION_COOKIE_NAME}>
        Bruker
      </Session>

      <Session copied={hasEmployee} icon={<Icon icon="mdi:work" />} tag={EMPLOYEE_SESSION_COOKIE_NAME}>
        Ansatt
      </Session>
    </ul>
  );
};

interface NameProps {
  copied: boolean;
  icon: React.ReactElement;
  tag: string;
  children: React.ReactNode;
}

const Session = ({ copied, icon, children, tag }: NameProps) => (
  <li className={`flex shrink-0 grow flex-row items-center gap-1 ${copied ? 'opacity-100' : 'opacity-50'}`}>
    <span className={copied ? 'text-green-500 text-xl' : 'text-xl'}>{icon}</span>
    <span>{children}</span>
    <span className="rounded-sm bg-sky-300 px-1 text-black text-sm dark:bg-sky-700 dark:text-white">{tag}</span>
  </li>
);

const root = document.getElementById('root');

if (root === null) {
  throw new Error('Failed to find the root element');
}

createRoot(root).render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>,
);
