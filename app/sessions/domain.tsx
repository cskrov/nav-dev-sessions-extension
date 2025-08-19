interface Props {
  children: string;
}

export const Domain = ({ children }: Props) => {
  const match = DEV_DOMAIN_REGEX.exec(children);

  if (match === null) {
    return <span>{children}</span>;
  }

  const [_, app, ingress] = match;

  return (
    <span>
      <span className="font-bold">{app}</span>
      <span className="text-gray-400">.{ingress}</span>
      <span className="text-gray-400">.dev.nav.no</span>
    </span>
  );
};

// kabal.intern.dev.nav.no
const DEV_DOMAIN_REGEX = /(\w+)\.(\w+)\.dev\.nav\.no$/;
