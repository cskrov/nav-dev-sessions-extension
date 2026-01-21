import { Icon } from '@iconify/react';
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Disable } from '@/app/disable';
import { InfoPage } from '@/app/info-page';
import { AddDomainPage } from '@/app/mappings/add-domain-page';
import { AddMappingPage } from '@/app/mappings/add-mapping-page';
import { EditMappingPage } from '@/app/mappings/edit-mapping-page';
import { MappingsList } from '@/app/mappings/mappings-list';
import { PageContainer } from '@/app/page-container';
import { PageHeader } from '@/app/page-header';

type Page =
  | { type: 'main' }
  | { type: 'add-mapping' }
  | { type: 'edit-mapping'; port: number }
  | { type: 'add-domain'; port: number }
  | { type: 'info' };

const Popup = () => {
  const [page, setPage] = useState<Page>({ type: 'main' });

  if (page.type === 'add-mapping') {
    return <AddMappingPage onBack={() => setPage({ type: 'main' })} />;
  }

  if (page.type === 'edit-mapping') {
    return (
      <EditMappingPage
        port={page.port}
        onBack={() => setPage({ type: 'main' })}
        onAddNew={() => setPage({ type: 'add-domain', port: page.port })}
      />
    );
  }

  if (page.type === 'add-domain') {
    return <AddDomainPage port={page.port} onBack={() => setPage({ type: 'edit-mapping', port: page.port })} />;
  }

  if (page.type === 'info') {
    return <InfoPage onBack={() => setPage({ type: 'main' })} />;
  }

  return (
    <PageContainer>
      <PageHeader
        action={
          <div className="flex flex-row items-center gap-2">
            <Disable />
            <button
              type="button"
              onClick={() => setPage({ type: 'info' })}
              className="cursor-pointer text-gray-400 hover:text-white"
              title="Info"
            >
              <Icon icon="mdi:information-outline" className="text-xl" />
            </button>
          </div>
        }
      >
        Mappings
      </PageHeader>

      <p className="text-gray-400 text-sm">Session cookie mappings:</p>

      <MappingsList
        onAddClick={() => setPage({ type: 'add-mapping' })}
        onEditClick={(port) => setPage({ type: 'edit-mapping', port })}
      />
    </PageContainer>
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
