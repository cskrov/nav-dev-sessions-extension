import { useEffect, useState } from 'react';
import { DomainSelector } from '@/app/mappings/domain-selector';
import { PageContainer } from '@/app/page-container';
import { PageHeader } from '@/app/page-header';
import { addMapping, getMappings } from '@/lib/mappings';

interface Props {
  port: number;
  onBack: () => void;
}

export const AddDomainPage = ({ port, onBack }: Props) => {
  const [existingDomains, setExistingDomains] = useState<string[]>([]);

  useEffect(() => {
    getMappings().then((mappings) => {
      const domainsForPort = mappings.filter((m) => m.port === port).map((m) => m.domain);
      setExistingDomains(domainsForPort);
    });
  }, [port]);

  const handleSelectDomain = async (domain: string) => {
    if (existingDomains.includes(domain)) {
      return;
    }

    await addMapping({ domain, port });
    onBack();
  };

  return (
    <PageContainer>
      <PageHeader onBack={onBack}>
        Add domain to <span className="font-mono text-sky-400">:{port}</span>
      </PageHeader>

      <p className="text-gray-400 text-sm">Click a domain to add:</p>

      <DomainSelector onSelectDomain={handleSelectDomain} excludeDomains={existingDomains} />
    </PageContainer>
  );
};
