import type React from 'react';
import { useEffect, useState } from 'react';
import browser, { type Cookies, type Storage } from 'webextension-polyfill';
import { HelpText } from '@/app/help-text';
import { DomainOption } from '@/app/sessions/option';
import { DomainOptionContainer, DomainOptionVariant } from '@/app/sessions/option-container';
import { Size, Tag } from '@/app/tag';
import type { CookieName } from '@/lib/constants';
import { listenDefaultDomain } from '@/lib/cookies';
import { deleteStoredDomain, onStoredDomainsChange } from '@/lib/domains';
import { getPreferredDomainSetting } from '@/lib/preferred-domain';

interface Props {
  exists: boolean;
  icon: React.ReactElement;
  cookies: Cookies.Cookie[];
  variant: CookieName;
  children: React.ReactNode;
}

export const Session = ({ exists, icon, children, cookies, variant }: Props) => {
  const [preferredDomain, setPreferredDomain] = useState<string | null>(null); // The preferred domain, null means the default domain will be used.
  const [defaultDomain, setDefaultDomain] = useState<string | null>(null); // The domain of the last used tab with relevant cookies.
  const [loading, setLoading] = useState<boolean>(true);

  console.log('UI preferredDomain', preferredDomain);
  console.log('UI defaultDomain', defaultDomain);

  const savePreferredDomain = async (preferredDomain: string | null) => {
    setLoading(true);

    if (preferredDomain === null) {
      await browser.storage.sync.remove(variant);
    } else {
      await browser.storage.sync.set({ [variant]: preferredDomain });
    }

    setLoading(false);

    console.log('Preferred domain saved:', preferredDomain);
  };

  // Listen for default domain.
  useEffect(() => {
    listenDefaultDomain(variant, setDefaultDomain);
  }, [variant]);

  // Get initial value from synced storage.
  useEffect(() => {
    getPreferredDomainSetting(variant).then((preferredDomain) => {
      setPreferredDomain(preferredDomain);
      setLoading(false);
    });
  }, [variant]);

  // Listen for changes in synced storage.
  useEffect(() => {
    const listener = ({ [variant]: preferredDomain }: Storage.StorageAreaOnChangedChangesType) => {
      console.log('Preferred domain changed:', preferredDomain);

      if (preferredDomain === undefined) {
        return;
      }

      const { newValue } = preferredDomain;

      if (newValue === null) {
        setPreferredDomain(newValue);
      } else if (verifyDomain(newValue)) {
        setPreferredDomain(newValue);
      } else {
        setPreferredDomain(null);
      }
    };

    browser.storage.sync.onChanged.addListener(listener);

    return () => browser.storage.sync.onChanged.removeListener(listener);
  }, [variant]);

  const [domains, setDomains] = useState<string[]>([]);

  useEffect(() => onStoredDomainsChange(setDomains), []);

  const defaultChecked = preferredDomain === null;

  return (
    <li className={`flex grow flex-col gap-2 ${exists ? 'opacity-100' : 'opacity-50'}`}>
      <div className="flex flex-row items-center gap-1">
        <span className={exists ? 'text-green-500 text-xl' : 'text-xl'}>{icon}</span>
        <span>{children}</span>
        <span className="rounded-sm bg-sky-700 px-1 text-sm text-white">{variant}</span>
      </div>

      <div role="radiogroup" className="ml-1 flex flex-col gap-1 border-l-4 border-l-slate-500 pl-2">
        <DomainOptionContainer
          checked={defaultChecked}
          icon="mdi:auto-awesome"
          loading={loading}
          onClick={() => savePreferredDomain(null)}
          variant={DomainOptionVariant.INFO}
        >
          <span>
            <span className="font-bold">Last used</span> <Tag size={Size.SMALL}>{defaultDomain ?? 'none'}</Tag>
          </span>
        </DomainOptionContainer>

        {domains
          .toSorted((a, b) => a.localeCompare(b))
          .map((domain) => {
            const cookie = cookies.find((cookie) => cookie.domain === domain);
            const hasCookie = cookie !== undefined;
            const checked = preferredDomain === domain;

            return (
              <DomainOption
                key={domain}
                domain={domain}
                checked={checked}
                loading={loading}
                onClick={() => savePreferredDomain(domain)}
                onDelete={hasCookie ? () => deleteCookie(cookie) : () => deleteStoredDomain(domain)}
                variant={getVariant(hasCookie, checked)}
                icon={getIcon(hasCookie)}
                deleteTitle={hasCookie ? 'Delete cookie' : 'Delete domain'}
                deleteIcon={hasCookie ? 'mdi:cookie-off-outline' : 'mdi:delete'}
              />
            );
          })}
      </div>

      {cookies.length > 1 ? (
        <HelpText className="ml-4">
          <p>
            There are multiple sessions active for different domains. Select the one you want to use for{' '}
            <Tag>localhost</Tag>.
          </p>
          <p>The extension does not know if sessions are expired. Delete any expired sessions.</p>
        </HelpText>
      ) : null}
    </li>
  );
};

const getVariant = (hasCookie: boolean, checked: boolean): DomainOptionVariant => {
  if (hasCookie) {
    return DomainOptionVariant.INFO;
  }

  if (checked) {
    return DomainOptionVariant.WARNING;
  }

  return DomainOptionVariant.NEUTRAL;
};

const getIcon = (hasCookie: boolean): string => {
  if (hasCookie) {
    return 'mdi:cookie';
  }

  return 'mdi:error';
};

const deleteCookie = (cookie: Cookies.Cookie) =>
  browser.cookies.remove({ url: `https://${cookie.domain}`, name: cookie.name });

const verifyDomain = (domain: unknown): domain is string =>
  typeof domain === 'string' && domain.endsWith('.dev.nav.no');
