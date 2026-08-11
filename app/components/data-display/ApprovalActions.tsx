'use client';

import Button from '../forms/Button';

interface ApprovalActionsProps {
  disabled: boolean;
  onApprove: () => void;
  onReject: () => void;
  approveLabel?: string;
  rejectLabel?: string;
}

export default function ApprovalActions({
  disabled,
  onApprove,
  onReject,
  approveLabel = 'Approve',
  rejectLabel = 'Reject',
}: ApprovalActionsProps) {
  return (
    <div className="flex gap-2">
      <Button variant="danger" size="sm" className="flex-1 whitespace-nowrap" disabled={disabled} onClick={onReject}>
        {rejectLabel}
      </Button>
      <Button variant="primary" size="sm" className="flex-1 whitespace-nowrap" disabled={disabled} onClick={onApprove}>
        {approveLabel}
      </Button>
    </div>
  );
}
