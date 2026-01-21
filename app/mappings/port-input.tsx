import { useEffect, useState } from 'react';
import { getSuggestedPortFromTabs } from '@/lib/localhost-tabs';

const DEFAULT_PORT = 3000;

interface PortInputProps {
  port: number;
  onPortChange: (port: number) => void;
}

export const PortInput = ({ port, onPortChange }: PortInputProps) => {
  const [input, setInput] = useState<string>('');
  const [suggestedPort, setSuggestedPort] = useState<number>(DEFAULT_PORT);

  useEffect(() => {
    getSuggestedPortFromTabs().then((tabPort) => {
      if (tabPort === null) {
        return;
      }

      setSuggestedPort(tabPort);
      onPortChange(tabPort);
    });
  }, [onPortChange]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowUp': {
        e.preventDefault();
        const next = port + 1;
        setInput(next.toString(10));
        onPortChange(next);
        break;
      }
      case 'ArrowDown': {
        e.preventDefault();
        const next = port - 1;
        setInput(next.toString(10));
        onPortChange(next);
        break;
      }
    }
  };

  return (
    <label className="inline-flex w-fit flex-row items-center rounded-sm border border-gray-600 bg-gray-800 focus-within:border-sky-500">
      <span className="py-1 pl-2 font-mono text-gray-400 text-md">localhost:</span>
      <input
        type="text"
        value={input}
        onChange={({ target: { value } }) => {
          setInput(value);

          if (value.length === 0) {
            onPortChange(suggestedPort);
          } else {
            onPortChange(parsePort(value));
          }
        }}
        onKeyDown={onKeyDown}
        placeholder={suggestedPort.toString(10)}
        className="w-20 bg-transparent py-1 pr-2 font-mono text-md text-white focus:outline-none"
        min="1"
        max="65535"
        inputMode="numeric"
        pattern="[0-9]*"
      />
    </label>
  );
};

const parsePort = (port: string): number => {
  if (port.length === 0) {
    return -1;
  }

  const parsed = Number.parseInt(port, 10);

  if (Number.isNaN(parsed)) {
    return -1;
  }

  if (!isInPortRange(parsed)) {
    return -1;
  }

  return parsed;
};

const isInPortRange = (port: number): boolean => port >= 1 && port <= 65535;
