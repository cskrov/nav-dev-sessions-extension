import { useState } from 'react';
import { FormActions } from '@/app/form-actions';
import { DomainSelector } from '@/app/mappings/domain-selector';
import { PageContainer } from '@/app/page-container';
import { PageHeader } from '@/app/page-header';
import { addMapping } from '@/lib/mappings';

interface Props {
  onBack: () => void;
  initialPort?: number;
}

export const AddMappingPage = ({ onBack, initialPort }: Props) => {
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [port, setPort] = useState<string>(initialPort?.toString() ?? '3000');

  const handleSubmit = async () => {
    if (selectedDomain === null || port === '') {
      return;
    }

    const portNumber = Number.parseInt(port, 10);

    if (Number.isNaN(portNumber) || portNumber < 1 || portNumber > 65535) {
      return;
    }

    await addMapping({ domain: selectedDomain, port: portNumber });
    onBack();
  };

  const isValidPort = port !== '' && !Number.isNaN(Number.parseInt(port, 10));
  const canSubmit = selectedDomain !== null && isValidPort;

  return (
    <PageContainer>
      <PageHeader onBack={onBack}>Add Mapping</PageHeader>

      <p className="text-gray-400 text-sm">Map session cookies to:</p>

      <label className="inline-flex w-fit flex-row items-center rounded-sm border border-gray-600 bg-gray-800 focus-within:border-sky-500">
        <span className="py-1 pl-2 font-mono text-gray-400 text-md">localhost:</span>
        <input
          type="number"
          value={port}
          onChange={(e) => setPort(e.target.value)}
          placeholder="3000"
          className="w-20 appearance-none bg-transparent py-1 pr-2 font-mono text-md text-white focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          min="1"
          max="65535"
        />
      </label>

      <p className="text-gray-400 text-sm">From domain:</p>

      <DomainSelector selectedDomain={selectedDomain} onSelectDomain={setSelectedDomain} />

      <FormActions onCancel={onBack} onSubmit={handleSubmit} submitLabel="Add Mapping" canSubmit={canSubmit} />
    </PageContainer>
  );
};
