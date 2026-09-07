'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarCheck, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { springSnappy } from '@/app/utils/motion';
import PageTopBar from '@/app/components/layout/PageTopBar';
import SectionCard from '@/app/components/layout/SectionCard';
import StatBox from '@/app/components/data-display/StatBox';
import StatusPill from '@/app/components/data-display/StatusPill';
import SelectField from '@/app/components/forms/SelectField';
import TextField from '@/app/components/forms/TextField';
import Button from '@/app/components/forms/Button';
import StatusModal from '@/app/components/feedback/StatusModal';
import { LEAVE_TYPES, LEAVE_STATUS } from '@/lib/constants';
import { statusColor } from '@/app/utils/statusColor';

const COMP_STATUS_MAP: Record<string, string> = {
  ST_LEAVE_APPROVED: 'Approved',
  ST_LEAVE_PENDING: 'Pending',
  ST_LEAVE_REJECTED: 'Rejected',
};

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
  'Compensatory Leave': LEAVE_TYPES.COMPENSATORY,
};

const leaveOptions = ['Paid Leave', 'Unpaid Leave', 'Special Leave', 'Compensatory Leave'];

const dayTypeOptions = ['Full Day (1 day)', 'Half Day (0.5 day)'];
const DAY_TYPE_MAP: Record<string, string> = {
  'Full Day (1 day)': 'FULL',
  'Half Day (0.5 day)': 'HALF',
};

export default function LeaveRequestPage() {
  const [selectedLeave, setSelectedLeave] = useState('');
  const [selectedSpecialLeave, setSelectedSpecialLeave] = useState('');
  const [reason, setReason] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [holidayWorkDate, setHolidayWorkDate] = useState('');
  const [holidayWorkEndDate, setHolidayWorkEndDate] = useState('');
  const [dayType, setDayType] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [leaveBalance, setLeaveBalance] = useState<number | null>(null);
  const [specialLeaveUsed, setSpecialLeaveUsed] = useState<number | null>(null);
  const [unpaidLeaveUsed, setUnpaidLeaveUsed] = useState<number | null>(null);
  const [compensatoryLeaveUsed, setCompensatoryLeaveUsed] = useState<number | null>(null);
  const [compDetails, setCompDetails] = useState<{ tanggalPengajuan: string; tanggalMulai: string; tanggalSelesai: string; jumlahHari: number; status: string }[]>([]);
  const [showCompModal, setShowCompModal] = useState(false);

  const loadBalance = async () => {
    try {
      const res = await fetch('/api/me', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setLeaveBalance(data.user?.leave?.sisaCuti ?? 0);
        setSpecialLeaveUsed(data.user?.leave?.specialLeaveUsed ?? 0);
        setUnpaidLeaveUsed(data.user?.leave?.unpaidLeaveUsed ?? 0);
        setCompensatoryLeaveUsed(data.user?.leave?.compensatoryLeaveUsed ?? 0);
        setCompDetails(data.user?.leave?.compensatoryLeaveDetails ?? []);
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
    (selectedLeave !== 'Compensatory Leave' || (holidayWorkDate !== '' && holidayWorkEndDate !== '' && dayType !== '')) &&
    startDate !== '' &&
    endDate !== '';

  // Jumlah hari yang diajukan (inklusif kalender) — konsisten dengan hitungan backend.
  const requestedDays = useMemo(() => {
    if (!startDate || !endDate) return null;
    const s = new Date(startDate + 'T00:00:00');
    const e = new Date(endDate + 'T00:00:00');
    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime()) || e < s) return null;
    return Math.round((e.getTime() - s.getTime()) / 86400000) + 1;
  }, [startDate, endDate]);

  // Jumlah hari kerja di hari libur (inklusif) — untuk cuti kompensasi
  const holidayWorkDays = useMemo(() => {
    if (selectedLeave !== 'Compensatory Leave' || !holidayWorkDate || !holidayWorkEndDate) return null;
    const s = new Date(holidayWorkDate + 'T00:00:00');
    const e = new Date(holidayWorkEndDate + 'T00:00:00');
    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime()) || e < s) return null;
    return Math.round((e.getTime() - s.getTime()) / 86400000) + 1;
  }, [selectedLeave, holidayWorkDate, holidayWorkEndDate]);

  // Jumlah hari cuti kompensasi = hari kerja × multiplier
  const compensatoryDays = useMemo(() => {
    if (holidayWorkDays == null || !dayType) return null;
    const multiplier = dayType === 'HALF' ? 0.5 : 1;
    return holidayWorkDays * multiplier;
  }, [holidayWorkDays, dayType]);

  // Warning keterlebihan saldo Paid Leave (live, saat rentang diisi).
  const balanceExceeded =
    selectedLeave === 'Paid Leave' &&
    requestedDays != null &&
    ((leaveBalance ?? 0) <= 0 || requestedDays > (leaveBalance ?? 0));

  // Validasi: Half Day cuti kompensasi hanya boleh 1 hari kerja
  const halfDayMultiDayError =
    selectedLeave === 'Compensatory Leave' &&
    dayType === 'HALF' &&
    holidayWorkDays != null &&
    holidayWorkDays > 1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    const idJenisCuti = leaveOptions.includes(selectedLeave) ? LEAVE_TYPE_MAP[selectedLeave] : '';
    const keterangan = selectedLeave === 'Special Leave' ? selectedSpecialLeave : reason;

    const body: Record<string, unknown> = { tanggalMulai: startDate, tanggalSelesai: endDate, idJenisCuti, keterangan };
    if (selectedLeave === 'Compensatory Leave') {
      body.tanggalKerjaHariLibur = holidayWorkDate;
      body.tanggalSelesaiKerjaLibur = holidayWorkEndDate;
      body.tipeCutiKompensasi = DAY_TYPE_MAP[dayType];
    }

    setSubmitting(true);
    setMessage(null);

    const res = await fetch('/api/leave', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
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
      setHolidayWorkDate('');
      setHolidayWorkEndDate('');
      setDayType('');
      loadBalance();
    } else {
      setMessage({ ok: false, text: data.error || 'Failed to submit request.' });
    }
  };

  return (
    <div className="w-full h-full flex flex-col gap-3">
      <PageTopBar showGreeting />

      <SectionCard title="Leave Balance(s)">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {leaveBalanceItems.map((item, idx) => (
            <StatBox key={idx} value={item.count} label={item.label} caption={item.caption} />
          ))}
          <StatBox
            value={compensatoryLeaveUsed != null ? String(compensatoryLeaveUsed) : '...'}
            label="Compensatory"
            caption="Compensatory Leave earned (approved)"
            onClick={() => setShowCompModal(true)}
          />
        </div>
      </SectionCard>

      <SectionCard as="form" onSubmit={handleSubmit} scroll className="flex-1 min-h-0">
        <div className="flex-shrink-0 flex items-center gap-2 pb-1.5 mb-2 border-b border-amana-primary-500">
          <h3 className="text-[20px] font-semibold text-amana-primary-500">Request Leave</h3>
          <CalendarCheck className="w-5 h-5 text-amana-primary-500" />
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto scroll-smooth pr-1">

        <div className="mb-4">
          <SelectField
            label="Select Leave Option"
            value={selectedLeave}
            onChange={(v) => {
              setSelectedLeave(v);
              setSelectedSpecialLeave('');
              setReason('');
              setHolidayWorkDate('');
              setHolidayWorkEndDate('');
              setDayType('');
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

        {selectedLeave === 'Compensatory Leave' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <TextField
                label="Holiday Work Start Date"
                type="date"
                value={holidayWorkDate}
                onChange={setHolidayWorkDate}
              />
              <TextField
                label="Holiday Work End Date"
                type="date"
                value={holidayWorkEndDate}
                onChange={setHolidayWorkEndDate}
              />
            </div>
            <div className="mb-4">
              <SelectField
                label="Day Type"
                value={dayType}
                onChange={setDayType}
                options={dayTypeOptions}
                placeholder="Select full day or half day..."
              />
            </div>
            {compensatoryDays != null && (
              <div className="mb-4 px-4 py-3 rounded-lg border text-[13px] font-medium bg-amana-success-100 border-amana-success-300 text-amana-success-500">
                {`Compensatory leave to be earned: ${compensatoryDays} day(s) (${holidayWorkDays} holiday work day(s) × ${dayType === 'HALF' ? '0.5' : '1'})`}
              </div>
            )}
            <div className="mb-4">
              <TextField
                label="Reason"
                value={reason}
                onChange={setReason}
                placeholder="Describe the work you did on the holiday..."
              />
            </div>
          </>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <TextField
            label={selectedLeave === 'Compensatory Leave' ? 'Compensatory Leave Start Date' : 'Start Date'}
            type="date"
            value={startDate}
            onChange={setStartDate}
          />
          <TextField
            label={selectedLeave === 'Compensatory Leave' ? 'Compensatory Leave End Date' : 'End Date'}
            type="date"
            value={endDate}
            onChange={setEndDate}
          />
        </div>

        {selectedLeave === 'Unpaid Leave' && (
          <div className={`mb-4 px-4 py-3 rounded-lg border text-[13px] font-medium ${(leaveBalance ?? 0) > 0 ? 'bg-amana-warning-100 border-amana-warning-300 text-amana-warning-500' : 'bg-amana-success-100 border-amana-success-300 text-amana-success-500'}`}>
            {(leaveBalance ?? 0) > 0
              ? `Unpaid leave can only be requested when your Paid balance = 0. Your remaining balance is ${leaveBalance} day(s).`
              : 'Your Paid balance is 0, you may proceed with Unpaid leave.'}
          </div>
        )}

        {balanceExceeded && (
          <div className="mb-4 px-4 py-3 rounded-lg border text-[13px] font-medium bg-amana-danger-100 border-amana-danger-500 text-amana-danger-500">
            {(leaveBalance ?? 0) <= 0
              ? 'Your Paid Leave balance is exhausted. Your request cannot exceed 0 day(s).'
              : `Your request of ${requestedDays} day(s) exceeds your remaining Paid Leave balance of ${leaveBalance} day(s).`}
          </div>
        )}

        {halfDayMultiDayError && (
          <div className="mb-4 px-4 py-3 rounded-lg border text-[13px] font-medium bg-amana-danger-100 border-amana-danger-500 text-amana-danger-500">
            Half Day compensatory leave requires exactly 1 holiday work day. Please adjust your holiday work date range.
          </div>
        )}
        </div>

        <div className="flex-shrink-0 flex justify-end pt-4 border-t border-amana-neutral-200">
          <Button type="submit" variant="primary" size="lg" className="w-full max-w-[280px]" disabled={!isFormValid || submitting || !!halfDayMultiDayError}>
            {submitting ? 'Submitting...' : 'Submit'}
          </Button>
        </div>
      </SectionCard>

      <StatusModal state={message} onClose={() => setMessage(null)} />

      {/* Compensatory Leave Details Modal */}
      {showCompModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-amana-neutral-100 rounded-[5px] border border-amana-primary-500 shadow-lg w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
            <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b border-amana-primary-500">
              <h2 className="text-[24px] font-semibold text-amana-primary-500">Your Compensatory Leave</h2>
              <motion.button
                onClick={() => setShowCompModal(false)}
                whileHover={{ rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                transition={springSnappy}
                className="text-amana-primary-500 hover:text-amana-danger-500"
              >
                <X className="w-6 h-6" />
              </motion.button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 pt-3 pb-2">
              {compDetails.length === 0 ? (
                <p className="text-sm text-amana-neutral-400 text-center py-8">No compensatory leave records found.</p>
              ) : (
                <table className="w-full table-fixed text-center border-collapse">
                  <colgroup>
                    <col className="w-[22%]" />
                    <col className="w-[22%]" />
                    <col className="w-[22%]" />
                    <col className="w-[10%]" />
                    <col className="w-[24%]" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th className="px-3 pb-2 border-b border-amana-neutral-300 bg-amana-neutral-100 text-center font-semibold text-amana-primary-500 text-[16px] border-r border-amana-neutral-300">Submitted On</th>
                      <th className="px-3 pb-2 border-b border-amana-neutral-300 bg-amana-neutral-100 text-center font-semibold text-amana-primary-500 text-[16px] border-r border-amana-neutral-300">Start Date</th>
                      <th className="px-3 pb-2 border-b border-amana-neutral-300 bg-amana-neutral-100 text-center font-semibold text-amana-primary-500 text-[16px] border-r border-amana-neutral-300">End Date</th>
                      <th className="px-3 pb-2 border-b border-amana-neutral-300 bg-amana-neutral-100 text-center font-semibold text-amana-primary-500 text-[16px] border-r border-amana-neutral-300">Days</th>
                      <th className="px-3 pb-2 border-b border-amana-neutral-300 bg-amana-neutral-100 text-center font-semibold text-amana-primary-500 text-[16px]">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {compDetails.map((item, idx) => (
                      <tr key={idx}>
                        <td className={`text-amana-neutral-500 text-center truncate px-3 py-2.5 text-[16px] border-r border-amana-neutral-300 ${idx < compDetails.length - 1 ? 'border-b' : ''}`}>
                          {item.tanggalPengajuan ? new Date(item.tanggalPengajuan + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                        </td>
                        <td className={`text-amana-neutral-500 text-center truncate px-3 py-2.5 text-[16px] border-r border-amana-neutral-300 ${idx < compDetails.length - 1 ? 'border-b' : ''}`}>
                          {new Date(item.tanggalMulai + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className={`text-amana-neutral-500 text-center truncate px-3 py-2.5 text-[16px] border-r border-amana-neutral-300 ${idx < compDetails.length - 1 ? 'border-b' : ''}`}>
                          {new Date(item.tanggalSelesai + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className={`text-amana-neutral-500 text-center truncate px-3 py-2.5 text-[16px] border-r border-amana-neutral-300 ${idx < compDetails.length - 1 ? 'border-b' : ''}`}>{item.jumlahHari}</td>
                        <td className={`text-center px-3 py-2.5 text-[16px] overflow-visible ${idx < compDetails.length - 1 ? 'border-b border-amana-neutral-300' : ''}`}>
                          <div className="flex justify-center">
                            <StatusPill color={statusColor(COMP_STATUS_MAP[item.status] ?? item.status)} fullWidth={false}>
                              {COMP_STATUS_MAP[item.status] ?? item.status}
                            </StatusPill>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="px-5 py-3 border-t border-amana-neutral-300 flex justify-end">
              <Button variant="outline" onClick={() => setShowCompModal(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}