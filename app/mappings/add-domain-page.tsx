import { useEffect, useState } from 'react';
import { FormActions } from '@/app/form-actions';
import { DomainSelector } from '@/app/mappings/domain-selector';
import { PageContainer } from '@/app/page-container';
import { PageHeader } from '@/app/page-header';
import { addMapping, getMappings } from '@/lib/mappings';

interface Props {
  port: number;
  onBack: () => void;
}

export const AddDomainPage = ({ port, onBack }: Props) => {
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [existingDomains, setExistingDomains] = useState<string[]>([]);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  useEffect(() => {
    getMappings().then((mappings) => {
      const domainsForPort = mappings.filter((m) => m.port === port).map((m) => m.domain);
      setExistingDomains(domainsForPort);
    });
  }, [port]);

  useEffect(() => {
    if (selectedDomain === null) {
      setDuplicateWarning(null);
      return;
    }

    if (existingDomains.includes(selectedDomain)) {
      setDuplicateWarning('This domain is already mapped to this port.');
    } else {
      setDuplicateWarning(null);
    }
  }, [selectedDomain, existingDomains]);

  const handleSubmit = async () => {
    if (selectedDomain === null) {
      return;
    }

    await addMapping({ domain: selectedDomain, port });
    onBack();
  };

  const canSubmit = selectedDomain !== null && duplicateWarning === null;

  return (
    <PageContainer>
      <PageHeader onBack={onBack}>
        Add domain to <span className="font-mono text-sky-400">:{port}</span>
      </PageHeader>

      <p className="text-gray-400 text-sm">Select a domain to add:</p>

      {duplicateWarning !== null && <p className="text-sm text-yellow-400">{duplicateWarning}</p>}

      <DomainSelector
        selectedDomain={selectedDomain}
        onSelectDomain={setSelectedDomain}
        excludeDomains={existingDomains}
      />

      <FormActions onCancel={onBack} onSubmit={handleSubmit} submitLabel="Add Domain" canSubmit={canSubmit} />
    </PageContainer>
  );
};
