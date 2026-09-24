'use client';

import Button from '../forms/Button';
import Spinner from '../feedback/Spinner';

interface ApprovalActionsProps {
  /** Replaces the buttons with a spinner (Figma node 1044:7212) while the action is submitting. */
  loading: boolean;
  onApprove: () => void;
  onReject: () => void;
  approveLabel?: string;
  rejectLabel?: string;
  /** 'danger-outline' (default, used by Leave Approval) or solid 'danger' (Payment Approval, per Figma). */
  rejectVariant?: 'danger-outline' | 'danger';
}

export default function ApprovalActions({
  loading,
  onApprove,
  onReject,
  approveLabel = 'Approve',
  rejectLabel = 'Reject',
  rejectVariant = 'danger-outline',
}: ApprovalActionsProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-9">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Button variant={rejectVariant} size="sm" className="flex-1 whitespace-nowrap" onClick={onReject}>
        {rejectLabel}
      </Button>
      <Button variant="primary" size="sm" className="flex-1 whitespace-nowrap" onClick={onApprove}>
        {approveLabel}
      </Button>
    </div>
  );
}
