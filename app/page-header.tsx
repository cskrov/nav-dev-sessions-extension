import { Icon } from '@iconify/react';

interface Props {
  children: React.ReactNode;
  onBack?: () => void;
  action?: React.ReactNode;
}

export const PageHeader = ({ children, onBack, action }: Props) => (
  <div className="flex flex-row items-center gap-2">
    <div className="flex h-6 w-6 shrink-0 items-center justify-center">
      {onBack !== undefined ? (
        <button type="button" onClick={onBack} className="cursor-pointer text-gray-400 hover:text-white" title="Back">
          <Icon icon="mdi:arrow-left" className="text-xl" />
        </button>
      ) : (
        <img src="./images/logo192.png" alt="Logo" className="h-6 w-6" />
      )}
    </div>
    <h2 className="font-bold text-base">{children}</h2>
    {action !== undefined ? <div className="ml-auto">{action}</div> : null}
  </div>
);
