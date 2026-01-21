interface Props {
  children: string;
}

enum Environment {
  DEV,
  PROD,
}

const getEnvironment = (domain: string): Environment =>
  domain.endsWith('.dev.nav.no') ? Environment.DEV : Environment.PROD;

const EnvironmentBadge = ({ environment }: { environment: Environment }) => {
  const isDev = environment === Environment.DEV;

  return (
    <span
      className={`ml-2 inline-flex items-center rounded px-1.5 py-0.5 font-medium text-xs ${
        isDev ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
      }`}
    >
      {isDev ? 'DEV' : 'PROD'}
    </span>
  );
};

export const Domain = ({ children }: Props) => {
  const [first, ...rest] = children.split('.');
  const environment = getEnvironment(children);

  if (first === undefined) {
    return (
      <span>
        {children}
        <EnvironmentBadge environment={environment} />
      </span>
    );
  }

  return (
    <span>
      <span className="font-bold">{first}</span>
      <span className="text-gray-400">.{rest.join('.')}</span>
      <EnvironmentBadge environment={environment} />
    </span>
  );
};
