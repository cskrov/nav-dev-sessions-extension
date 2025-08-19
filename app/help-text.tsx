import { Icon } from '@iconify/react';
import { useState } from 'react';
import { Button } from '@/app/button';

interface HelpTextProps {
  className?: string;
  children: React.ReactNode;
}

export const HelpText = ({ className, children }: HelpTextProps) => {
  const [open, setOpen] = useState<boolean>(false);

  return (
    <div className={`flex flex-row items-start gap-1 ${className}`}>
      <Button onClick={() => setOpen(!open)} className="rounded-sm aria-[checked=true]:bg-blue-700" aria-checked={open}>
        <Icon icon="mdi:question-mark-circle" />
      </Button>
      {open ? (
        <div className="flex flex-col gap-2 whitespace-normal rounded-sm border border-blue-500 px-2 py-1 text-sm">
          {children}
        </div>
      ) : null}
    </div>
  );
};
