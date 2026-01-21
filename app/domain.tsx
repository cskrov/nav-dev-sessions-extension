import { Badge, BadgeVariant } from '@/app/badge';

interface DomainProps {
  children: string;
}

enum Environment {
  DEV,
  PROD,
}

const getEnvironment = (domain: string): Environment =>
  domain.endsWith('.dev.nav.no') ? Environment.DEV : Environment.PROD;

interface EnvironmentBadgeProps {
  domain: string;
}

export const EnvironmentBadge = ({ domain }: EnvironmentBadgeProps) => {
  const isDev = getEnvironment(domain) === Environment.DEV;

  return <Badge variant={isDev ? BadgeVariant.Yellow : BadgeVariant.Green}>{isDev ? 'DEV' : 'PROD'}</Badge>;
};

export const Domain = ({ children }: DomainProps) => {
  const [first, ...rest] = children.split('.');

  if (first === undefined) {
    return <span>{children}</span>;
  }

  return (
    <span>
      <span className="font-bold">{first}</span>
      <span className="text-gray-400">.{rest.join('.')}</span>
    </span>
  );
};
