export enum BadgeVariant {
  Gray,
  Yellow,
  Green,
}

interface Props {
  children: React.ReactNode;
  variant?: BadgeVariant;
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  [BadgeVariant.Gray]: 'bg-gray-600 text-white',
  [BadgeVariant.Yellow]: 'bg-yellow-100 text-yellow-800',
  [BadgeVariant.Green]: 'bg-green-100 text-green-800',
};

export const Badge = ({ children, variant = BadgeVariant.Gray }: Props) => (
  <span
    className={`inline-flex items-center rounded px-1.5 py-0.5 font-medium font-mono text-xs ${VARIANT_CLASSES[variant]}`}
  >
    {children}
  </span>
);
