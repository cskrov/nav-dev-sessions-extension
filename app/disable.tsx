import { useEffect, useState } from 'react';
import browser, { type Storage } from 'webextension-polyfill';

interface Props {
  className?: string;
}

export const Disable = ({ className }: Props) => {
  const [disabled, setDisabled] = useState(false);

  const onClick = () => browser.storage.sync.set({ disabled: !disabled });

  useEffect(() => {
    browser.storage.sync.get('disabled').then(({ disabled }) => {
      setDisabled(typeof disabled === 'boolean' ? disabled : false);
    });

    const listener = (changes: Storage.StorageAreaOnChangedChangesType) => {
      if ('disabled' in changes) {
        const { disabled } = changes;
        console.log('Disable extension changed:', disabled);
        setDisabled(typeof disabled.newValue === 'boolean' ? disabled.newValue : false);
      }
    };

    browser.storage.sync.onChanged.addListener(listener);

    return () => {
      browser.storage.sync.onChanged.removeListener(listener);
    };
  }, []);

  const enabled = !disabled;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={onClick}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
        enabled ? 'bg-blue-500' : 'bg-gray-600'
      } ${className}`}
      title={enabled ? 'Disable the extension' : 'Enable the extension'}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
          enabled ? 'translate-x-4.5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
};
