import browser, { type Storage } from 'webextension-polyfill';

export const onStoredDomainsChange = (callback: (domains: string[]) => void) => {
  const listener = (changes: Storage.StorageAreaWithUsageOnChangedChangesType) => {
    if ('domains' in changes) {
      const { newValue } = changes.domains;

      if (isStringArray(newValue)) {
        callback(newValue);
      }
    }
  };

  browser.storage.sync.onChanged.addListener(listener);

  getStoredDomains().then(callback);

  return () => browser.storage.sync.onChanged.removeListener(listener);
};

export const getStoredDomains = async (): Promise<string[]> => {
  const { domains } = await browser.storage.sync.get('domains');

  return domains === undefined || !isStringArray(domains) ? [] : domains;
};

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

export const deleteStoredDomain = async (domain: string) => {
  const domains = await getStoredDomains();
  const updatedDomains = domains.filter((d) => d !== domain);
  await browser.storage.sync.set({ domains: updatedDomains });
};
