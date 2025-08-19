export enum Size {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
}

interface Props {
  children: React.ReactNode;
  size?: Size;
}

export const Tag = ({ children, size = Size.MEDIUM }: Props) => (
  <span className={`rounded-sm bg-slate-500 font-mono text-white not-italic ${SIZE_CLASSES[size]}`}>{children}</span>
);

const SIZE_CLASSES: Record<Size, string> = {
  [Size.SMALL]: 'text-sm px-0.5',
  [Size.MEDIUM]: 'text-md px-0.5',
  [Size.LARGE]: 'text-lg px-1',
};
