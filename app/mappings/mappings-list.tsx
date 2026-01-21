import { useEffect, useState } from 'react';
import type { Cookies } from 'webextension-polyfill';
import { AddButton } from '@/app/add-button';
import { MappingItem } from '@/app/mappings/mapping-item';
import { cookieObserver } from '@/lib/cookie-observer';
import { type Mapping, onMappingsChange } from '@/lib/mappings';

interface Props {
  onAddClick: () => void;
  onEditClick: (port: number) => void;
}

export const MappingsList = ({ onAddClick, onEditClick }: Props) => {
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [cookiesMap, setCookiesMap] = useState<Map<string, Cookies.Cookie[]>>(new Map());

  useEffect(() => onMappingsChange(setMappings), []);

  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    for (const mapping of mappings) {
      const unsubscribe = cookieObserver.addListener(mapping.domain, (cookies) => {
        setCookiesMap((prev) => {
          const next = new Map(prev);
          next.set(mapping.domain, cookies);
          return next;
        });
      });
      unsubscribers.push(unsubscribe);
    }

    return () => {
      for (const unsubscribe of unsubscribers) {
        unsubscribe();
      }
    };
  }, [mappings]);

  // Group mappings by port
  const mappingsByPort = mappings.reduce<Map<number, Mapping[]>>((acc, mapping) => {
    const existing = acc.get(mapping.port) ?? [];
    existing.push(mapping);
    acc.set(mapping.port, existing);
    return acc;
  }, new Map());

  // Sort ports
  const sortedPorts = [...mappingsByPort.keys()].sort((a, b) => a - b);

  return (
    <ul className="flex flex-col gap-2">
      {sortedPorts.map((port) => {
        const portMappings = mappingsByPort.get(port) ?? [];
        const activeMapping = portMappings.find((m) => m.active) ?? portMappings[0];
        const alternativeCount = portMappings.length - 1;

        if (activeMapping === undefined) {
          return null;
        }

        return (
          <MappingItem
            key={port}
            activeMapping={activeMapping}
            alternativeCount={alternativeCount}
            cookies={cookiesMap.get(activeMapping.domain) ?? []}
            onClick={() => onEditClick(port)}
          />
        );
      })}
      <li className="flex flex-row">
        <AddButton onClick={onAddClick}>Add mapping</AddButton>
      </li>
    </ul>
  );
};
