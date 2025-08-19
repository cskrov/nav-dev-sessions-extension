import { Icon } from '@iconify/react';

export enum DomainOptionVariant {
  INFO = 'info',
  WARNING = 'warning',
  NEUTRAL = 'neutral',
}

interface Props {
  children: React.ReactNode;
  checked: boolean;
  loading: boolean;
  icon?: string;
  onClick: () => void;
  onDelete?: () => void;
  variant?: DomainOptionVariant;
  deleteTitle?: string;
  deleteIcon?: string;
}

export const DomainOptionContainer = ({
  children,
  checked,
  loading,
  onClick,
  onDelete,
  variant = DomainOptionVariant.INFO,
  icon = 'mdi:cookie',
  deleteTitle,
  deleteIcon = 'mdi:delete',
}: Props) => (
  <div
    data-checked={checked}
    className={`flex cursor-pointer flex-row items-center gap-1 rounded-sm border-2 px-2 ${VARIANT_CLASSES[variant]}`}
  >
    <Icon
      icon={loading ? 'mdi:loading' : icon}
      className={loading ? 'animate-spin' : ''}
      style={{ opacity: checked ? 1 : 0.6 }}
    />

    <label className="flex cursor-pointer flex-row items-center">
      <input type="radio" checked={checked} onChange={onClick} disabled={loading} className="appearance-none" />

      {children}
    </label>

    {onDelete !== undefined ? (
      <button
        type="button"
        onClick={onDelete}
        className="ml-auto cursor-pointer text-red-500 hover:text-red-700"
        title={deleteTitle}
      >
        <Icon icon={deleteIcon} />
      </button>
    ) : null}
  </div>
);

const VARIANT_CLASSES: Record<DomainOptionVariant, string> = {
  [DomainOptionVariant.INFO]: 'border-sky-700 data-[checked=true]:bg-sky-900',
  [DomainOptionVariant.WARNING]: 'border-amber-700 data-[checked=true]:bg-amber-900',
  [DomainOptionVariant.NEUTRAL]: 'border-gray-700 data-[checked=true]:bg-gray-900',
};
