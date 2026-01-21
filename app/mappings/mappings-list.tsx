import { useEffect, useState } from 'react';
import type { Cookies } from 'webextension-polyfill';
import { Button } from '@/app/button';
import { MappingItem } from '@/app/mappings/mapping-item';
import { cookieObserver } from '@/lib/cookie-observer';
import { type Mapping, onMappingsChange, removeMapping } from '@/lib/mappings';

interface Props {
  onAddClick: () => void;
}

export const MappingsList = ({ onAddClick }: Props) => {
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

  const handleDelete = (port: number) => {
    removeMapping(port);
  };

  return (
    <section>
      <div className="mb-2 flex flex-row items-center justify-between">
        <h2 className="font-bold text-base">Mappings</h2>
        <Button onClick={onAddClick} className="rounded-sm text-xs">
          + Add
        </Button>
      </div>

      {mappings.length === 0 ? (
        <p className="text-gray-400 text-sm italic">No mappings configured. Click "Add" to create one.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {mappings
            .toSorted((a, b) => a.port - b.port)
            .map((mapping) => (
              <MappingItem
                key={mapping.port}
                mapping={mapping}
                cookies={cookiesMap.get(mapping.domain) ?? []}
                onDelete={() => handleDelete(mapping.port)}
              />
            ))}
        </ul>
      )}
    </section>
  );
};
