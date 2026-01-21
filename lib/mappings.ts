import browser, { type Storage } from 'webextension-polyfill';
import { CookieName, getUserCookieName, LOCALHOST } from '@/lib/constants';

export interface Mapping {
  domain: string;
  port: number;
}

const STORAGE_KEY = 'mappings';

export const getMappings = async (): Promise<Mapping[]> => {
  const { [STORAGE_KEY]: mappings } = await browser.storage.sync.get(STORAGE_KEY);

  if (mappings === undefined || !isMappingArray(mappings)) {
    return [];
  }

  return mappings;
};

export const addMapping = async (mapping: Mapping): Promise<void> => {
  const mappings = await getMappings();

  // Check if mapping for this port already exists
  const existingIndex = mappings.findIndex((m) => m.port === mapping.port);

  if (existingIndex !== -1) {
    // Overwrite existing mapping
    mappings[existingIndex] = mapping;
  } else {
    // Add new mapping
    mappings.push(mapping);
  }

  await browser.storage.sync.set({ [STORAGE_KEY]: mappings });
};

export const removeMapping = async (port: number): Promise<void> => {
  const mappings = await getMappings();
  const mappingToRemove = mappings.find((m) => m.port === port);
  const updatedMappings = mappings.filter((m) => m.port !== port);
  await browser.storage.sync.set({ [STORAGE_KEY]: updatedMappings });

  // Delete relevant cookies from localhost
  if (mappingToRemove !== undefined) {
    const userCookieName = getUserCookieName(mappingToRemove.domain);
    const cookieNamesToDelete = [CookieName.EMPLOYEE, userCookieName];

    for (const cookieName of cookieNamesToDelete) {
      try {
        await browser.cookies.remove({
          url: `http://${LOCALHOST}:${port}`,
          name: cookieName,
        });
        await browser.cookies.remove({
          url: `https://${LOCALHOST}:${port}`,
          name: cookieName,
        });
      } catch (error) {
        console.debug(`Failed to remove cookie ${cookieName} from localhost:${port}:`, error);
      }
    }
  }
};

export const updateMapping = async (port: number, updates: Partial<Mapping>): Promise<void> => {
  const mappings = await getMappings();
  const updatedMappings = mappings.map((m) => (m.port === port ? { ...m, ...updates } : m));
  await browser.storage.sync.set({ [STORAGE_KEY]: updatedMappings });
};

export const onMappingsChange = (callback: (mappings: Mapping[]) => void): (() => void) => {
  const listener = (changes: Storage.StorageAreaOnChangedChangesType) => {
    if (STORAGE_KEY in changes) {
      const { newValue } = changes[STORAGE_KEY];

      if (isMappingArray(newValue)) {
        callback(newValue);
      } else if (newValue === undefined) {
        callback([]);
      }
    }
  };

  browser.storage.sync.onChanged.addListener(listener);

  // Get initial value
  getMappings().then(callback);

  return () => browser.storage.sync.onChanged.removeListener(listener);
};

const isMappingArray = (value: unknown): value is Mapping[] =>
  Array.isArray(value) &&
  value.every(
    (item) =>
      item !== null &&
      typeof item === 'object' &&
      'domain' in item &&
      typeof item.domain === 'string' &&
      'port' in item &&
      typeof item.port === 'number',
  );
