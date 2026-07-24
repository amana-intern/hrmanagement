import Button from './Button';

interface DialogActionsProps {
  onCancel: () => void;
  onConfirm: () => void;
  cancelLabel?: string;
  confirmLabel?: string;
  confirmVariant?: 'primary' | 'danger';
  loading?: boolean;
}

export default function DialogActions({
  onCancel,
  onConfirm,
  cancelLabel = 'Cancel',
  confirmLabel = 'Confirm',
  confirmVariant = 'primary',
  loading,
}: DialogActionsProps) {
  return (
    <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-amana-sec-6">
      <Button variant="ghost" onClick={onCancel}>{cancelLabel}</Button>
      <Button variant={confirmVariant} onClick={onConfirm} disabled={loading}>
        {loading ? 'Processing...' : confirmLabel}
      </Button>
    </div>
  );
}
