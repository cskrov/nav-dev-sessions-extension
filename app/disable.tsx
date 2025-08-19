import { useEffect, useState } from 'react';
import browser, { type Storage } from 'webextension-polyfill';
import { Button } from '@/app/button';

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

    const listener = (changes: Storage.StorageAreaWithUsageOnChangedChangesType) => {
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

  return (
    <Button
      onClick={onClick}
      className={`rounded-sm ${className}`}
      title={disabled ? 'Enables the extension' : 'Disables the extension'}
    >
      {disabled ? 'Enable' : 'Disable'}
    </Button>
  );
};
