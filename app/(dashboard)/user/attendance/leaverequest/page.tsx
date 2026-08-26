'use client';

import { useEffect, useState } from 'react';
import { CalendarCheck } from 'lucide-react';
import PageTopBar from '@/app/components/layout/PageTopBar';
import SectionCard from '@/app/components/layout/SectionCard';
import StatBox from '@/app/components/data-display/StatBox';
import SelectField from '@/app/components/forms/SelectField';
import TextField from '@/app/components/forms/TextField';
import Button from '@/app/components/forms/Button';
import StatusModal, { StatusState } from '@/app/components/feedback/StatusModal';
import { LEAVE_TYPES } from '@/lib/constants';

const specialLeaveList = [
  'Menstruation pain (Maximum of 2 days)',
  'Marriage (Maximum of 3 days)',
  'Child marriage (Maximum of 2 days)',
  'Circumcision (Maximum of 2 days)',
  'Child baptism (Maximum of 2 days)',
  'Wife giving birth (Maximum of 2 days)',
  'Immediate family member passed away (Maximum of 2 days)',
  'Household family member passed away (Maximum of 1 day)',
  'State obligation (depends on company policy)',
  'Performing Hajj pilgrimage (depends on company policy)',
  'Emergency accident (depends on company policy)',
];

const LEAVE_TYPE_MAP: Record<string, string> = {
  'Paid Leave': LEAVE_TYPES.PAID,
  'Special Leave': LEAVE_TYPES.SPECIAL,
  'Unpaid Leave': LEAVE_TYPES.UNPAID,
};

const leaveOptions = ['Paid Leave', 'Unpaid Leave', 'Special Leave'];

export default function LeaveRequestPage() {
  const [selectedLeave, setSelectedLeave] = useState('');
  const [selectedSpecialLeave, setSelectedSpecialLeave] = useState('');
  const [reason, setReason] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<StatusState | null>(null);
  const [leaveBalance, setLeaveBalance] = useState<number | null>(null);
  const [specialLeaveUsed, setSpecialLeaveUsed] = useState<number | null>(null);
  const [unpaidLeaveUsed, setUnpaidLeaveUsed] = useState<number | null>(null);

  const loadBalance = async () => {
    try {
      const res = await fetch('/api/me', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setLeaveBalance(data.user?.leave?.sisaCuti ?? 0);
        setSpecialLeaveUsed(data.user?.leave?.specialLeaveUsed ?? 0);
        setUnpaidLeaveUsed(data.user?.leave?.unpaidLeaveUsed ?? 0);
      }
    } catch {}
  };

  useEffect(() => {
    (async () => {
      await loadBalance();
    })();
  }, []);

  const leaveBalanceItems = [
    { count: leaveBalance != null ? String(leaveBalance) : '...', label: 'Paid Leave', caption: 'Remaining Paid Leave Balance(s)' },
    { count: specialLeaveUsed != null ? String(specialLeaveUsed) : '...', label: 'Special Leave', caption: 'Special Leave used this year' },
    { count: unpaidLeaveUsed != null ? String(unpaidLeaveUsed) : '...', label: 'Unpaid Leave', caption: 'Unpaid Leave used this year' },
  ];

  const isFormValid =
    selectedLeave !== '' &&
    (selectedLeave !== 'Special Leave' || selectedSpecialLeave !== '') &&
    startDate !== '' &&
    endDate !== '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    const idJenisCuti = leaveOptions.includes(selectedLeave) ? LEAVE_TYPE_MAP[selectedLeave] : '';
    const keterangan = selectedLeave === 'Special Leave' ? selectedSpecialLeave : reason;

    setSubmitting(true);
    setMessage(null);

    const res = await fetch('/api/leave', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tanggalMulai: startDate, tanggalSelesai: endDate, idJenisCuti, keterangan }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (res.ok) {
      setMessage({ ok: true, text: 'Leave request successfully submitted for partner approval.' });
      setSelectedLeave('');
      setSelectedSpecialLeave('');
      setReason('');
      setStartDate('');
      setEndDate('');
      loadBalance();
    } else {
      setMessage({ ok: false, text: data.error || 'Failed to submit request.' });
    }
  };

  return (
    <div className="w-full h-full flex flex-col gap-3">
      <PageTopBar showGreeting />

      <SectionCard title="Leave Balance(s)">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {leaveBalanceItems.map((item, idx) => (
            <StatBox key={idx} value={item.count} label={item.label} caption={item.caption} />
          ))}
        </div>
      </SectionCard>

      <SectionCard as="form" onSubmit={handleSubmit} scroll>
        <div className="flex-shrink-0 flex items-center gap-2 pb-1.5 mb-2 border-b border-amana-primary-500">
          <h3 className="text-[20px] font-semibold text-amana-primary-500">Request Leave</h3>
          <CalendarCheck className="w-5 h-5 text-amana-primary-500" />
        </div>

        <div className="mb-4">
          <SelectField
            label="Select Leave Option"
            value={selectedLeave}
            onChange={(v) => {
              setSelectedLeave(v);
              setSelectedSpecialLeave('');
              setReason('');
            }}
            options={leaveOptions}
            placeholder="Click here to select your leave option..."
          />
        </div>

        {selectedLeave === 'Special Leave' && (
          <div className="mb-4">
            <SelectField
              label="Select Special Leave Reason"
              value={selectedSpecialLeave}
              onChange={setSelectedSpecialLeave}
              options={specialLeaveList}
              placeholder="Click here to select the reason..."
            />
          </div>
        )}

        {(selectedLeave === 'Paid Leave' || selectedLeave === 'Unpaid Leave') && (
          <div className="mb-4">
            <TextField
              label="Reason"
              value={reason}
              onChange={setReason}
              placeholder="Tell us the reason for your leave..."
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <TextField
            label="Start Date"
            type="date"
            value={startDate}
            onChange={setStartDate}
          />
          <TextField
            label="End Date"
            type="date"
            value={endDate}
            onChange={setEndDate}
          />
        </div>

        {selectedLeave === 'Unpaid Leave' && (
          <p className="mb-4 text-[13px] text-amana-neutral-400">
            {(leaveBalance ?? 0) > 0
              ? `Unpaid leave can only be requested once your Paid Leave balance is 0. You still have ${leaveBalance} day(s) remaining.`
              : 'Your Paid Leave balance is 0, you may proceed with Unpaid Leave.'}
          </p>
        )}

        <div className="flex justify-end pt-4 border-t border-amana-neutral-200">
          <Button type="submit" variant="primary" size="lg" className="w-full max-w-[280px]" disabled={!isFormValid || submitting}>
            {submitting ? 'Submitting...' : 'Submit'}
          </Button>
        </div>
      </SectionCard>

      <StatusModal state={message} onClose={() => setMessage(null)} />
    </div>
  );
}