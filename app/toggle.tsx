import type React from 'react';
import { Button } from '@/app/button';

interface Option<T extends string> {
  label: string;
  value: T;
}

interface Props<T extends string> {
  options: Option<T>[];
  selected: T;
  onChange: (value: T) => void;
}

export const Toggle = <T extends string>({ options, selected, onChange }: Props<T>) => (
  <div role="radiogroup">
    {options.map(({ label, value }) => (
      <OptionButton key={value} isSelected={value === selected} onClick={() => onChange(value)}>
        {label}
      </OptionButton>
    ))}
  </div>
);

interface OptionButtonProps {
  children: React.ReactNode;
  isSelected: boolean;
  onClick: () => void;
}

const OptionButton = ({ children, isSelected, onClick }: OptionButtonProps) => (
  // biome-ignore lint/a11y/useSemanticElements: Toggle
  <Button
    role="radio"
    aria-checked={isSelected}
    onClick={onClick}
    className="first:rounded-l-sm last:rounded-r-sm aria-[checked=true]:bg-blue-700"
  >
    {children}
  </Button>
);
