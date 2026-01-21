import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Disable } from '@/app/disable';
import { AddMappingPage } from '@/app/mappings/add-mapping-page';
import { MappingsList } from '@/app/mappings/mappings-list';
import { Tag } from '@/app/tag';

type Page = 'main' | 'add-mapping';

const Popup = () => {
  const [page, setPage] = useState<Page>('main');

  if (page === 'add-mapping') {
    return <AddMappingPage onBack={() => setPage('main')} />;
  }

  return (
    <>
      <div className="mb-2 flex flex-row items-start gap-2 whitespace-nowrap">
        <h1 className="font-bold">Nav Dev Sessions Extension</h1>
        <Disable className="ml-auto" />
      </div>

      <MappingsList onAddClick={() => setPage('add-mapping')} />

      <hr className="my-4" />

      <section className="flex flex-col gap-2 text-sm italic">
        <p>
          This extension only affects requests made to <Tag>localhost</Tag> with the configured port mappings.
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
