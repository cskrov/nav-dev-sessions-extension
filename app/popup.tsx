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

enum Page {
  Main,
  AddMapping,
  EditMapping,
  AddDomain,
  Info,
}

type PageState =
  | { type: Page.Main }
  | { type: Page.AddMapping }
  | { type: Page.EditMapping; port: number }
  | { type: Page.AddDomain; port: number }
  | { type: Page.Info };

const Popup = () => {
  const [page, setPage] = useState<PageState>({ type: Page.Main });

  if (page.type === Page.AddMapping) {
    return <AddMappingPage onBack={() => setPage({ type: Page.Main })} />;
  }

  if (page.type === Page.EditMapping) {
    return (
      <EditMappingPage
        port={page.port}
        onBack={() => setPage({ type: Page.Main })}
        onAddNew={() => setPage({ type: Page.AddDomain, port: page.port })}
      />
    );
  }

  if (page.type === Page.AddDomain) {
    return <AddDomainPage port={page.port} onBack={() => setPage({ type: Page.EditMapping, port: page.port })} />;
  }

  if (page.type === Page.Info) {
    return <InfoPage onBack={() => setPage({ type: Page.Main })} />;
  }

  return (
    <PageContainer>
      <PageHeader
        action={
          <div className="flex flex-row items-center gap-2">
            <Disable />
            <button
              type="button"
              onClick={() => setPage({ type: Page.Info })}
              className="cursor-pointer text-gray-400 hover:text-white"
              title="Info"
            >
              <Icon icon="mdi:information-outline" className="text-xl" />
            </button>
          </div>
        }
      >
        Session cookie mappings
      </PageHeader>

      <p className="text-gray-400 text-sm">
        Session cookies are copied for the following localhost ports and domain pairs:
      </p>

      <MappingsList
        onAddClick={() => setPage({ type: Page.AddMapping })}
        onEditClick={(port) => setPage({ type: Page.EditMapping, port })}
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
