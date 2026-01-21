import { Icon } from '@iconify/react';

interface AddButtonProps {
  onClick: () => void;
  children: string;
}

export const AddButton = ({ onClick, children }: AddButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    className="flex grow cursor-pointer flex-row items-center gap-2 rounded-md border-2 border-gray-600 border-dashed px-2 py-1 text-gray-400 hover:border-gray-500 hover:text-gray-300"
  >
    <Icon icon="mdi:plus" className="text-lg" />
    <span className="text-sm">{children}</span>
  </button>
);
