import { Button } from '@/app/button';

interface FormActionsProps {
  onCancel: () => void;
  onSubmit: () => void;
  submitLabel: string;
  canSubmit: boolean;
}

export const FormActions = ({ onCancel, onSubmit, submitLabel, canSubmit }: FormActionsProps) => (
  <div className="flex flex-row justify-end gap-2">
    <Button onClick={onCancel} className="rounded-sm bg-gray-600 hover:bg-gray-500">
      Cancel
    </Button>

    <Button
      onClick={onSubmit}
      disabled={!canSubmit}
      className={`rounded-sm ${canSubmit ? '' : 'cursor-not-allowed opacity-50'}`}
    >
      {submitLabel}
    </Button>
  </div>
);
