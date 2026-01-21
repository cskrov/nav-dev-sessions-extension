import browser, { type Storage } from 'webextension-polyfill';
import { CookieName, getUserCookieName, LOCALHOST } from '@/lib/constants';

export interface Mapping {
  domain: string;
  port: number;
  active: boolean;
}

const STORAGE_KEY = 'mappings';

export const getMappings = async (): Promise<Mapping[]> => {
  const { [STORAGE_KEY]: mappings } = await browser.storage.sync.get(STORAGE_KEY);

  if (mappings === undefined || !isMappingArray(mappings)) {
    return [];
  }

  // Migrate old mappings that don't have the active field
  return mappings.map((m) => ({
    ...m,
    active: m.active ?? true,
  }));
};

export const getActiveMappings = async (): Promise<Mapping[]> => {
  const mappings = await getMappings();
  return mappings.filter((m) => m.active);
};

export const addMapping = async (mapping: Omit<Mapping, 'active'>): Promise<void> => {
  const mappings = await getMappings();

  // Deactivate any existing mappings for this port
  const updatedMappings = mappings.map((m) => (m.port === mapping.port ? { ...m, active: false } : m));

  // Add new mapping as active
  updatedMappings.push({ ...mapping, active: true });

  await browser.storage.sync.set({ [STORAGE_KEY]: updatedMappings });
};

export const removeMapping = async (port: number, domain: string): Promise<void> => {
  const mappings = await getMappings();
  const mappingToRemove = mappings.find((m) => m.port === port && m.domain === domain);
  const updatedMappings = mappings.filter((m) => !(m.port === port && m.domain === domain));

  // If we removed the active mapping, activate another one for the same port if available
  if (mappingToRemove?.active) {
    const nextMapping = updatedMappings.find((m) => m.port === port);
    if (nextMapping !== undefined) {
      nextMapping.active = true;
    }
  }

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

export const setActiveMapping = async (port: number, domain: string): Promise<void> => {
  const mappings = await getMappings();
  const updatedMappings = mappings.map((m) => {
    if (m.port === port) {
      return { ...m, active: m.domain === domain };
    }
    return m;
  });
  await browser.storage.sync.set({ [STORAGE_KEY]: updatedMappings });
};

export const onMappingsChange = (callback: (mappings: Mapping[]) => void): (() => void) => {
  const listener = (changes: Storage.StorageAreaOnChangedChangesType) => {
    if (STORAGE_KEY in changes) {
      const { newValue } = changes[STORAGE_KEY];

      if (isMappingArray(newValue)) {
        // Apply migration for active field
        const migratedMappings = newValue.map((m) => ({
          ...m,
          active: m.active ?? true,
        }));
        callback(migratedMappings);
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
