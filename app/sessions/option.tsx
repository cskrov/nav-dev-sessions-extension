import { Domain } from '@/app/sessions/domain';
import { DomainOptionContainer, type DomainOptionVariant } from '@/app/sessions/option-container';

interface Props {
  domain: string;
  checked: boolean;
  loading: boolean;
  onClick: () => void;
  onDelete?: () => void;
  variant?: DomainOptionVariant;
  icon?: string;
  deleteTitle?: string;
  deleteIcon?: string;
}

export const DomainOption = ({
  domain,
  checked,
  loading,
  onClick,
  onDelete,
  variant,
  icon,
  deleteTitle,
  deleteIcon,
}: Props) => (
  <DomainOptionContainer
    key={domain}
    checked={checked}
    icon={icon}
    loading={loading}
    variant={variant}
    onClick={onClick}
    onDelete={onDelete}
    deleteTitle={deleteTitle}
    deleteIcon={deleteIcon}
  >
    <Domain>{domain}</Domain>
  </DomainOptionContainer>
);
