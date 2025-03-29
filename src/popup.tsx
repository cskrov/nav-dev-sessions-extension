import { EMPLOYEE_SESSION_COOKIE_NAME, USER_SESSION_COOKIE_NAME } from '@/constants';
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { handleStatus } from 'status';

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
    <article className="w-fit">
      <dl className="m-0 grid gap-x-2 gap-y-1 [grid-template-columns:min-content_min-content]">
        <dt className={`whitespace-nowrap ${hasEmployee ? '' : 'line-through'}`}>
          Ansatt ({EMPLOYEE_SESSION_COOKIE_NAME})
        </dt>
        <dd>{hasEmployee.toString()}</dd>

        <dt className={`whitespace-nowrap ${hasUser ? '' : 'line-through'}`}>Bruker ({USER_SESSION_COOKIE_NAME})</dt>
        <dd>{hasUser.toString()}</dd>
      </dl>
    </article>
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
