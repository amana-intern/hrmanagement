'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarCheck } from 'lucide-react';
import PageTopBar from '@/app/components/layout/PageTopBar';
import SectionCard from '@/app/components/layout/SectionCard';
import StatBox from '@/app/components/data-display/StatBox';
import StatusPill from '@/app/components/data-display/StatusPill';
import DataTable, { DataTableColumn } from '@/app/components/data-display/DataTable';
import SelectField from '@/app/components/forms/SelectField';
import TextField from '@/app/components/forms/TextField';
import { SearchDateRangeCalendarField } from '@/app/components/forms/SearchFields';
import Button from '@/app/components/forms/Button';
import Modal from '@/app/components/feedback/Modal';
import DetailModal, { DetailRow } from '@/app/components/feedback/DetailModal';
import StatusModal from '@/app/components/feedback/StatusModal';
import { LEAVE_TYPES, LEAVE_STATUS, specialLeaveMaxDays, specialLeaveName, todayISOWIB } from '@/lib/constants';
import { statusColor } from '@/app/utils/statusColor';
import { formatDateWIB } from '@/app/utils/formatDate';

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

interface LeaveListItem {
  idCuti: string;
  tanggalMulai: string | null;
  tanggalSelesai: string | null;
  jumlahHari: number | null;
  tanggalPengajuan: string | null;
  keterangan: string | null;
  catatan: string | null;
  idStatus?: string | null;
  idJenisCuti?: string | null;
  tanggalKerjaHariLibur: string | null;
  tanggalSelesaiKerjaLibur: string | null;
  masterJenisCuti?: { namaJenis: string } | null;
  masterStatus?: { namaStatus: string } | null;
}

interface LeaveHistoryRow {
  id: string;
  type: string;
  submitted: string;
  period: string;
  duration: string;
  status: string;
  reason: string | null;
  note: string | null;
  holidayWork: string | null;
  details: null;
}

function makeLeaveHistoryColumns(onView: (row: LeaveHistoryRow) => void): DataTableColumn<LeaveHistoryRow>[] {
  return [
    { key: 'type', label: 'Type', width: '13%', minPx: 100 },
    { key: 'submitted', label: 'Submitted', width: '17%', minPx: 140 },
    {
      key: 'period',
      label: 'Period',
      width: '24%',
      minPx: 200,
      render: (row) => <span className="block whitespace-normal break-words">{row.period}</span>,
    },
    { key: 'duration', label: 'Duration', width: '14%', minPx: 120 },
    {
      key: 'status',
      label: 'Status',
      width: '15%',
      minPx: 120,
      render: (row) => (
        <div className="flex justify-center">
          <StatusPill color={statusColor(row.status)} fullWidth={false}>
            {row.status}
          </StatusPill>
        </div>
      ),
    },
    {
      key: 'details',
      label: 'Details',
      width: '13%',
      minPx: 110,
      render: (row) => (
        <div className="flex justify-center">
          <Button variant="outline" size="sm" onClick={() => onView(row)}>
            View
          </Button>
        </div>
      ),
    },
  ];
}

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
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [leaveHistory, setLeaveHistory] = useState<LeaveHistoryRow[]>([]);
  const [historyDetail, setHistoryDetail] = useState<LeaveHistoryRow | null>(null);
  const [pendingPaidDays, setPendingPaidDays] = useState(0);
  const [menstrualUses, setMenstrualUses] = useState<{ start: string; days: number }[]>([]);
  const [blockedDates, setBlockedDates] = useState<{ tanggal: string | null; tanggalAkhir: string | null; alasan: string | null }[]>([]);

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

  const loadBlocked = async () => {
    try {
      const res = await fetch('/api/hr/blocked-dates', { cache: 'no-store' });
      if (res.ok) setBlockedDates(((await res.json()).list ?? []) as typeof blockedDates);
    } catch {}
  };

  const loadHistory = async () => {
    try {
      const res = await fetch('/api/leave/list', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        const rows: LeaveListItem[] = data.list ?? [];
        setMenstrualUses(
          rows
            .filter(
              (r) =>
                r.idJenisCuti === LEAVE_TYPES.SPECIAL &&
                (r.idStatus === LEAVE_STATUS.PENDING || r.idStatus === LEAVE_STATUS.APPROVED) &&
                r.keterangan?.toLowerCase().includes('menstruation') &&
                r.tanggalMulai
            )
            .map((r) => ({ start: r.tanggalMulai!.slice(0, 10), days: r.jumlahHari ?? 0 }))
        );
        setPendingPaidDays(
          rows
            .filter((r) => r.idJenisCuti === LEAVE_TYPES.PAID && r.idStatus === LEAVE_STATUS.PENDING)
            .reduce((sum, r) => sum + (r.jumlahHari ?? 0), 0)
        );
        setLeaveHistory(
          rows.map((r) => ({
            id: r.idCuti,
            type: r.masterJenisCuti?.namaJenis ?? '-',
            submitted: r.tanggalPengajuan ? formatDateWIB(r.tanggalPengajuan) : '-',
            period: r.tanggalMulai && r.tanggalSelesai ? `${formatDateWIB(r.tanggalMulai)} - ${formatDateWIB(r.tanggalSelesai)}` : '-',
            duration: r.jumlahHari != null ? `${r.jumlahHari} Day(s)` : '-',
            status: r.masterStatus?.namaStatus ?? '-',
            reason: r.keterangan ?? null,
            note: r.catatan ?? null,
            holidayWork:
              r.tanggalKerjaHariLibur && r.tanggalSelesaiKerjaLibur
                ? `${formatDateWIB(r.tanggalKerjaHariLibur)} - ${formatDateWIB(r.tanggalSelesaiKerjaLibur)}`
                : null,
            details: null,
          }))
        );
      }
    } catch {}
  };

  useEffect(() => {
    (async () => {
      await Promise.all([loadBalance(), loadHistory(), loadBlocked()]);
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

  // Special Leave: batas hari per alasan (mis. Marriage = 3), plus Menstruation maks 2 hari per bulan (sama dengan server).
  const specialLeaveError = useMemo(() => {
    if (selectedLeave !== 'Special Leave' || !selectedSpecialLeave || requestedDays == null) return null;
    const maxDays = specialLeaveMaxDays(selectedSpecialLeave);
    if (maxDays != null && requestedDays > maxDays) {
      return `${specialLeaveName(selectedSpecialLeave)} leave is limited to ${maxDays} day(s) per request (you selected ${requestedDays}).`;
    }
    if (!selectedSpecialLeave.toLowerCase().includes('menstruation')) return null;
    const month = startDate.slice(0, 7);
    const used = menstrualUses.filter((u) => u.start.slice(0, 7) === month).reduce((sum, u) => sum + u.days, 0);
    return used + requestedDays > 2 ? `Menstrual leave this month already ${used} day(s) (max 2 days/month).` : null;
  }, [selectedLeave, selectedSpecialLeave, requestedDays, startDate, menstrualUses]);

  // Tanggal yang diblokir HR (berlaku semua jenis cuti) — sama dengan pengecekan server.
  const blockedError = useMemo(() => {
    if (!startDate || !endDate || endDate < startDate) return null;
    const hits = blockedDates.filter((b) => {
      const bStart = b.tanggal?.slice(0, 10) ?? startDate;
      const bEnd = b.tanggalAkhir?.slice(0, 10) ?? bStart;
      return bStart <= endDate && startDate <= bEnd;
    });
    if (hits.length === 0) return null;
    const label = (b: (typeof hits)[number]) =>
      b.tanggalAkhir ? `${formatDateWIB(b.tanggal)} - ${formatDateWIB(b.tanggalAkhir)}` : formatDateWIB(b.tanggal);
    return `Your leave period includes blocked date(s): ${hits.map(label).join(', ')}${hits[0].alasan ? ` (${hits[0].alasan})` : ''}. Please choose other dates.`;
  }, [startDate, endDate, blockedDates]);

  // Unpaid hanya boleh saat saldo Paid = 0 (aturan yang sama dengan server).
  const unpaidBlocked = selectedLeave === 'Unpaid Leave' && (leaveBalance ?? 0) > 0;

  // Saldo yang sedang "dicadangkan" pengajuan Paid Leave sebelumnya yang belum di-approve (sama dengan aturan server).
  const availableAfterPending = (leaveBalance ?? 0) - pendingPaidDays;
  const quotaInUse =
    selectedLeave === 'Paid Leave' &&
    !balanceExceeded &&
    pendingPaidDays > 0 &&
    (availableAfterPending <= 0 || (requestedDays != null && requestedDays > availableAfterPending));

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
      loadHistory();
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
          <Button type="button" variant="outline" size="sm" className="ml-auto" onClick={() => setShowHistoryModal(true)}>
            View Leave History
          </Button>
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
            <div className="mb-4">
              <SearchDateRangeCalendarField
                label="Holiday Work Period"
                fromValue={holidayWorkDate}
                toValue={holidayWorkEndDate}
                onFromChange={setHolidayWorkDate}
                onToChange={setHolidayWorkEndDate}
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

        <div className="mb-4">
          <SearchDateRangeCalendarField
            label={selectedLeave === 'Compensatory Leave' ? 'Compensatory Leave Period' : 'Leave Period'}
            minDate={todayISOWIB()}
            fromValue={startDate}
            toValue={endDate}
            onFromChange={setStartDate}
            onToChange={setEndDate}
          />
        </div>

        {selectedLeave === 'Unpaid Leave' && (
          <div className={`mb-4 px-4 py-3 rounded-lg border text-[13px] font-medium ${unpaidBlocked ? 'bg-amana-danger-100 border-amana-danger-500 text-amana-danger-500' : 'bg-amana-success-100 border-amana-success-300 text-amana-success-500'}`}>
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

        {specialLeaveError && (
          <div className="mb-4 px-4 py-3 rounded-lg border text-[13px] font-medium bg-amana-danger-100 border-amana-danger-500 text-amana-danger-500">
            {specialLeaveError}
          </div>
        )}

        {blockedError && (
          <div className="mb-4 px-4 py-3 rounded-lg border text-[13px] font-medium bg-amana-danger-100 border-amana-danger-500 text-amana-danger-500">
            {blockedError}
          </div>
        )}

        {quotaInUse && (
          <div className="mb-4 px-4 py-3 rounded-lg border text-[13px] font-medium bg-amana-danger-100 border-amana-danger-500 text-amana-danger-500">
            Your leave quota is currently in usage/waiting for approval from your previous leave request!{' '}
            {availableAfterPending > 0
              ? `Only ${availableAfterPending} day(s) of Paid Leave are still available (${pendingPaidDays} day(s) reserved by pending requests).`
              : `${pendingPaidDays} day(s) of your remaining Paid Leave are reserved by pending requests.`}
          </div>
        )}

        {halfDayMultiDayError && (
          <div className="mb-4 px-4 py-3 rounded-lg border text-[13px] font-medium bg-amana-danger-100 border-amana-danger-500 text-amana-danger-500">
            Half Day compensatory leave requires exactly 1 holiday work day. Please adjust your holiday work date range.
          </div>
        )}
        </div>

        <div className="flex-shrink-0 flex justify-end pt-4 border-t border-amana-neutral-200">
          <Button type="submit" variant="primary" size="lg" className="w-full max-w-[280px]" disabled={!isFormValid || submitting || !!halfDayMultiDayError || balanceExceeded || quotaInUse || unpaidBlocked || !!specialLeaveError || !!blockedError} isLoading={submitting}>
            {submitting ? 'Submitting...' : 'Submit'}
          </Button>
        </div>
      </SectionCard>

      <StatusModal state={message} onClose={() => setMessage(null)} />

      {showHistoryModal && (
        <Modal title="Leave History" onClose={() => setShowHistoryModal(false)} maxWidth="max-w-4xl" className="max-h-[80vh]" showCloseButton={false}>
          <div className="flex-1 min-h-0 overflow-y-auto px-5 pt-3 pb-2 flex flex-col">
            <DataTable columns={makeLeaveHistoryColumns(setHistoryDetail)} rows={leaveHistory} emptyMessage="No leave history yet." />
          </div>
          <div className="px-5 py-3 border-t border-amana-neutral-300 flex justify-end flex-shrink-0">
            <Button variant="outline" onClick={() => setShowHistoryModal(false)}>Close</Button>
          </div>
        </Modal>
      )}

      {historyDetail && (
        <DetailModal
          title={`${historyDetail.type} Detail`}
          onClose={() => setHistoryDetail(null)}
          maxWidth="max-w-lg"
          zIndex={60}
          status={{ label: historyDetail.status, color: statusColor(historyDetail.status) }}
          topFields={[{ label: 'Approver Note', value: historyDetail.note }]}
        >
          <DetailRow label="Submitted" value={historyDetail.submitted} />
          <DetailRow label="Period" value={historyDetail.period} />
          <DetailRow label="Duration" value={historyDetail.duration} />
          <DetailRow label="Holiday Work Period" value={historyDetail.holidayWork} />
          <DetailRow label="Reason" value={historyDetail.reason} />
        </DetailModal>
      )}

      {/* Compensatory Leave Details Modal */}
      {showCompModal && (
        <Modal title="Your Compensatory Leave" onClose={() => setShowCompModal(false)} maxWidth="max-w-2xl" className="max-h-[80vh]" showCloseButton={false}>
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
                    <tr key={idx} className="hover:bg-amana-primary-100 transition-colors duration-150">
                      <td className={`text-amana-neutral-500 text-center truncate px-3 py-2.5 text-[16px] border-r border-amana-neutral-300 ${idx < compDetails.length - 1 ? 'border-b' : ''}`}>
                        {formatDateWIB(item.tanggalPengajuan)}
                      </td>
                      <td className={`text-amana-neutral-500 text-center truncate px-3 py-2.5 text-[16px] border-r border-amana-neutral-300 ${idx < compDetails.length - 1 ? 'border-b' : ''}`}>
                        {formatDateWIB(item.tanggalMulai)}
                      </td>
                      <td className={`text-amana-neutral-500 text-center truncate px-3 py-2.5 text-[16px] border-r border-amana-neutral-300 ${idx < compDetails.length - 1 ? 'border-b' : ''}`}>
                        {formatDateWIB(item.tanggalSelesai)}
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
        </Modal>
      )}
    </div>
  );
}