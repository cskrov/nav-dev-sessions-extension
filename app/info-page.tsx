import { Button } from '@/app/button';
import { PageContainer } from '@/app/page-container';
import { PageHeader } from '@/app/page-header';
import { Tag } from '@/app/tag';
import { EXTERNAL_DOMAINS_DEV, EXTERNAL_DOMAINS_PROD, LOCALHOST } from '@/lib/constants';

interface InfoPageProps {
  onBack: () => void;
}

export const InfoPage = ({ onBack }: InfoPageProps) => (
  <PageContainer>
    <PageHeader onBack={onBack}>Info</PageHeader>

    <section className="flex flex-col gap-2 text-sm italic">
      <p>
        This extension only affects requests made from <Tag>{LOCALHOST}</Tag> tabs with the configured port mappings,
        and to the following domains:
      </p>

      <ul>
        <li>
          <Tag>{LOCALHOST}</Tag>
        </li>
        {EXTERNAL_DOMAINS_DEV.map((domain) => (
          <li key={domain}>
            <Tag>{domain}</Tag>
          </li>
        ))}
        {EXTERNAL_DOMAINS_PROD.map((domain) => (
          <li key={domain}>
            <Tag>{domain}</Tag>
          </li>
        ))}
      </ul>

      <p>
        Source code:{' '}
        <a
          href="https://github.com/cskrov/nav-dev-sessions-extension"
          target="_blank"
          className="underline hover:text-blue-500"
          rel="noopener"
        >
          GitHub
        </a>
      </p>
    </section>

    <div className="flex flex-row justify-end">
      <Button onClick={onBack} className="rounded-sm">
        Close
      </Button>
    </div>
  </PageContainer>
);
