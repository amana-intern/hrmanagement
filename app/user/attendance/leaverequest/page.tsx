'use client';

import { useEffect, useState } from 'react';
import { CalendarCheck } from 'lucide-react';
import PageTopBar from '../../../components/layout/PageTopBar';
import SectionCard from '../../../components/layout/SectionCard';
import StatBox from '../../../components/data-display/StatBox';
import SelectField from '../../../components/forms/SelectField';
import TextField from '../../../components/forms/TextField';
import Button from '../../../components/forms/Button';
import { LEAVE_TYPES } from '@/lib/constants';
import { useRole, isAdminRole } from '@/app/utils/useRole';

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
  const role = useRole();
  const isAdmin = isAdminRole(role);
  const [selectedLeave, setSelectedLeave] = useState('');
  const [selectedSpecialLeave, setSelectedSpecialLeave] = useState('');
  const [reason, setReason] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
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

  const requestedDays = (() => {
    if (!startDate || !endDate) return null;
    const s = new Date(`${startDate}T00:00:00`);
    const e = new Date(`${endDate}T00:00:00`);
    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime()) || e < s) return null;
    return Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  })();

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
      setMessage({ ok: true, text: 'Leave request submitted for partner approval.' });
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
      <PageTopBar showGreeting section={isAdmin ? 'Attendance' : 'Services'} page={isAdmin ? 'Leave Request' : 'Request Leave'} />

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

        {selectedLeave === 'Paid Leave' && requestedDays != null && leaveBalance != null && requestedDays > leaveBalance && (
          <div className="mb-4 px-4 py-3 rounded-lg border text-[13px] font-medium bg-amana-danger-100 border-amana-danger-300 text-amana-danger-500">
            The number of days ({requestedDays}) exceeds your remaining Paid Leave balance ({leaveBalance} days). The request will be rejected.
          </div>
        )}

        {selectedLeave === 'Unpaid Leave' && (
          <div className={`mb-4 px-4 py-3 rounded-lg border text-[13px] font-medium ${(leaveBalance ?? 0) > 0 ? 'bg-amana-warning-100 border-amana-warning-300 text-amana-warning-500' : 'bg-amana-success-100 border-amana-success-300 text-amana-success-500'}`}>
            {(leaveBalance ?? 0) > 0
              ? `Unpaid leave can only be submitted when your Paid balance is 0. You still have ${leaveBalance} days.`
              : 'Your Paid balance is 0; please submit an Unpaid leave.'}
          </div>
        )}

        {message && (
          <div className={`mb-4 px-4 py-2.5 rounded-lg border text-[13px] font-medium ${message.ok ? 'bg-amana-success-100 border-amana-success-300 text-amana-success-500' : 'bg-amana-danger-100 border-amana-danger-300 text-amana-danger-500'}`}>
            {message.text}
          </div>
        )}

        <div className="flex justify-end pt-4 border-t border-amana-neutral-200">
          <Button type="submit" variant="primary" size="lg" className="w-full max-w-[280px]" disabled={!isFormValid || submitting}>
            {submitting ? 'Submitting...' : 'Submit'}
          </Button>
        </div>
      </SectionCard>
    </div>
  );
}