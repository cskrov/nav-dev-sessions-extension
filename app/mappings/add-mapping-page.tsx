import { useEffect, useState } from 'react';
import { DomainSelector } from '@/app/mappings/domain-selector';
import { PortInput } from '@/app/mappings/port-input';
import { PageContainer } from '@/app/page-container';
import { PageHeader } from '@/app/page-header';
import { addMapping, getMappings } from '@/lib/mappings';

interface Props {
  onBack: () => void;
}

const DEFAULT_PORT = 3000;

export const AddMappingPage = ({ onBack }: Props) => {
  const [port, setPort] = useState<number>(DEFAULT_PORT);
  const [existingDomains, setExistingDomains] = useState<string[]>([]);

  const isValidPort = port !== -1;

  useEffect(() => {
    getMappings().then((mappings) => {
      const domainsForPort = mappings.filter((m) => m.port === port).map((m) => m.domain);
      setExistingDomains(domainsForPort);
    });
  }, [port]);

  const handleSelectDomain = async (domain: string) => {
    await addMapping({ domain, port });
    onBack();
  };

  return (
    <PageContainer>
      <PageHeader onBack={onBack}>Add Mapping</PageHeader>

      <p className="text-gray-400 text-sm">Map session cookies to:</p>

      <PortInput port={port} onPortChange={setPort} />

      <p className="text-gray-400 text-sm">Select a domain to add:</p>

      {isValidPort ? (
        <DomainSelector onSelectDomain={handleSelectDomain} excludeDomains={existingDomains} />
      ) : (
        <p className="text-sm text-yellow-400">Enter a valid port number (1-65535)</p>
      )}
    </PageContainer>
  );
};
