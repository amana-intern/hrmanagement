'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import PageTopBar from '@/app/components/layout/PageTopBar';
import SectionCard from '@/app/components/layout/SectionCard';
import SearchPanel from '@/app/components/data-display/SearchPanel';
import DataTable, { type DataTableColumn } from '@/app/components/data-display/DataTable';
import StatusPill from '@/app/components/data-display/StatusPill';
import Button from '@/app/components/forms/Button';
import TextField from '@/app/components/forms/TextField';
import SelectField from '@/app/components/forms/SelectField';
import ComboboxField from '@/app/components/forms/ComboboxField';
import DateField from '@/app/components/forms/DateField';
import SharedUploadBox from '@/app/components/forms/UploadBox';
import { SearchTextField, SearchDateRangeCalendarField } from '@/app/components/forms/SearchFields';
import StatusModal from '@/app/components/feedback/StatusModal';
import UploadProgressModal from '@/app/components/feedback/UploadProgressModal';
import PaymentDetailModal, { PaymentDetailRow } from '@/app/components/PaymentDetailModal';
import { easeOut } from '@/app/utils/motion';
import { uploadWithProgress } from '@/app/utils/uploadWithProgress';
import { formatDateWIB } from '@/app/utils/formatDate';
import { useFilters } from '@/app/utils/useFilters';
import { parsePaymentDetail } from '@/lib/paymentDetail';
import { chargecodeCategory, CATEGORY_DEPARTMENT, CHARGECODE_OPTIONS } from '@/lib/chargecodes';
import { PAYMENT_KATEGORI, PAYMENT_STATUS } from '@/lib/constants';

interface OutgoingPayment {
  id: string;
  idRequest: string;
  timeSubmission: string | null;
  chargecode: string;
  pm: string;
  paymentUnder: string;
  idStatus: string | null;
  namaStatus: string | null;
  details: null;
  detailRow: PaymentDetailRow;
}

function statusColor(s: string | null): string {
  switch (s) {
    case PAYMENT_STATUS.PENDING_OPS:
      return 'bg-amana-warning-500';
    case PAYMENT_STATUS.PENDING_PARTNER:
      return 'bg-amana-success-500';
    case PAYMENT_STATUS.REJECTED:
      return 'bg-amana-danger-500';
    default:
      return 'bg-amana-success-500';
  }
}

function mapOutgoingPayments(raw: Record<string, unknown>[]): OutgoingPayment[] {
  return raw.map((p) => {
    const row = p as {
      idRequest?: string;
      createdAt?: string | null;
      masterKategoriPayment?: { namaKategori?: string | null } | null;
      projectID?: string | null;
      idStatus?: string | null;
      masterStatus?: { namaStatus?: string | null } | null;
      idKategoriPayment?: string;
      nominal?: number | string;
      detail?: string | null;
      catatan?: string | null;
      tanggalJadwalPembayaran?: string | null;
      attachments?: { fileName?: string | null; fileURL?: string | null; kategori?: string | null }[];
    };
    const d = parsePaymentDetail(row.detail ?? null);
    const idRequest = row.idRequest ?? String(Math.random());
    return {
      id: idRequest,
      idRequest,
      timeSubmission: row.createdAt ?? null,
      chargecode: d.chargecode ?? '-',
      pm: d.submittingAs ?? '-',
      paymentUnder: d.paymentUnder ?? '-',
      idStatus: row.idStatus ?? null,
      namaStatus: row.masterStatus?.namaStatus ?? null,
      details: null,
      detailRow: {
        idRequest,
        idKategoriPayment: row.idKategoriPayment,
        nominal: row.nominal,
        projectID: row.projectID,
        detail: row.detail,
        catatan: row.catatan,
        createdAt: row.createdAt,
        tanggalJadwalPembayaran: row.tanggalJadwalPembayaran,
        attachments: row.attachments ?? [],
        masterKategoriPayment: row.masterKategoriPayment,
        statusLabel: row.masterStatus?.namaStatus ?? row.idStatus ?? undefined,
      },
    };
  });
}

function makePaymentColumns(onView: (row: PaymentDetailRow) => void): DataTableColumn<OutgoingPayment>[] {
  return [
    { key: 'idRequest', label: 'ID', width: '13%', minPx: 120 },
    { key: 'chargecode', label: 'Chargecode', width: '13%', minPx: 130 },
    { key: 'pm', label: 'PM', width: '12%', minPx: 110 },
    { key: 'paymentUnder', label: 'Payment Under', width: '15%', minPx: 140 },
    {
      key: 'timeSubmission',
      label: 'Submitted',
      width: '15%',
      minPx: 150,
      sortValue: (r) => (r.timeSubmission ? new Date(r.timeSubmission).getTime() : 0),
      render: (r) => <span className="whitespace-nowrap">{formatDateWIB(r.timeSubmission)}</span>,
    },
    {
      key: 'idStatus',
      label: 'Status',
      width: '14%',
      minPx: 140,
      render: (r) => <StatusPill color={statusColor(r.idStatus)}>{r.namaStatus ?? r.idStatus ?? '-'}</StatusPill>,
    },
    {
      key: 'details',
      label: 'Details',
      width: '10%',
      minPx: 90,
      render: (r) => (
        <Button variant="outline" size="sm" className="w-full whitespace-nowrap" onClick={() => onView(r.detailRow)}>
          View
        </Button>
      ),
    },
  ];
}

interface Filters {
  chargecode: string;
  pm: string;
  from: string;
  to: string;
}

const emptyFilters: Filters = { chargecode: '', pm: '', from: '', to: '' };

function UploadBox({
  label,
  fileKey,
  files,
  onFileChange,
}: {
  label?: string;
  fileKey: string;
  files: { [key: string]: File | null };
  onFileChange: (key: string, file: File | null) => void;
}) {
  return (
    <SharedUploadBox
      file={files[fileKey] ?? null}
      placeholder={label || 'Upload Invoice Document (.pdf)'}
      onFileSelect={(file) => onFileChange(fileKey, file)}
      className="h-36"
    />
  );
}

export default function PaymentPage() {
  const [step, setStep] = useState(1);
  const [uploadPct, setUploadPct] = useState<number | null>(null);
  const [submittingAs, setSubmittingAs] = useState('');
  const [emailTerkait, setEmailTerkait] = useState('');
  const isStep1Complete = submittingAs.trim() !== '' && emailTerkait.trim() !== '';

  const [paymentFor, setPaymentFor] = useState('');
  const [chargecode, setChargecode] = useState('');
  const [partner, setPartner] = useState('');
  const [paymentUnder, setPaymentUnder] = useState('');
  const [partnerList, setPartnerList] = useState<{ nama: string; department: string; departments: string[] }[]>([]);
  const isStep2HeaderComplete = chargecode !== '' && partner !== '' && paymentUnder !== '';
  const [vendorName, setVendorName] = useState('');
  const [vendorNpwp, setVendorNpwp] = useState('');
  const [vendorAmount, setVendorAmount] = useState('');
  const [vendorDueDate, setVendorDueDate] = useState('');
  const [indActivity, setIndActivity] = useState('');
  const [indReceiver, setIndReceiver] = useState('');
  const [individualRole, setIndividualRole] = useState('');
  const [indOtherRole, setIndOtherRole] = useState('');
  const [indBankName, setIndBankName] = useState('');
  const [indAccNumber, setIndAccNumber] = useState('');
  const [indComponent, setIndComponent] = useState('');
  const [indAmount, setIndAmount] = useState('');
  const [perDiemEvent, setPerDiemEvent] = useState('');
  const [perDiemParticipants, setPerDiemParticipants] = useState('');
  const [files, setFiles] = useState<{ [key: string]: File | null }>({});

  const [outgoingPayments, setOutgoingPayments] = useState<OutgoingPayment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [detailRow, setDetailRow] = useState<PaymentDetailRow | null>(null);
  const paymentColumns = makePaymentColumns(setDetailRow);
  const { draft, applied, setField, handleSearch, handleReset } = useFilters<Filters>(emptyFilters);

  const filteredPayments = useMemo(() => {
    const chargecodeQ = applied.chargecode.trim().toLowerCase();
    const pmQ = applied.pm.trim().toLowerCase();
    const from = applied.from ? new Date(applied.from + 'T00:00:00') : null;
    const to = applied.to ? new Date(applied.to + 'T23:59:59') : null;
    return outgoingPayments.filter((p) => {
      const matchChargecode = !chargecodeQ || p.chargecode.toLowerCase().includes(chargecodeQ);
      const matchPM = !pmQ || p.pm.toLowerCase().includes(pmQ);
      const submitted = p.timeSubmission ? new Date(p.timeSubmission) : null;
      const matchDate = (!from || (submitted && submitted >= from)) && (!to || (submitted && submitted <= to));
      return matchChargecode && matchPM && matchDate;
    });
  }, [outgoingPayments, applied]);

  // Fetch partner list dari API
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/partners', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          const list = (data.list ?? []).map((p: { nama: string; department: string; departments?: string[] }) => ({
            nama: p.nama,
            department: p.department,
            departments: p.departments ?? [],
          }));
          setPartnerList(list);
        }
      } catch {}
    })();
  }, []);

  // Chargecode: partner terkait di-resolve otomatis, tidak bisa dipilih manual.
  useEffect(() => {
    const category = chargecodeCategory.get(chargecode);
    const dept = category ? CATEGORY_DEPARTMENT[category] : undefined;
    if (!dept) {
      setPartner('');
      return;
    }
    const match = partnerList.find((p) => p.department === dept || p.departments.includes(dept));
    setPartner(match?.nama ?? '');
  }, [chargecode, partnerList]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/payment/list?scope=mine', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setOutgoingPayments(mapOutgoingPayments((data.list ?? []) as Record<string, unknown>[]));
        }
      } catch {}
      setLoadingPayments(false);
    })();
  }, []);

  const handleFileChange = (key: string, file: File | null) => {
    setFiles((prev) => ({ ...prev, [key]: file }));
  };

  const isVendorComplete =
    isStep2HeaderComplete &&
    vendorName.trim() !== '' && vendorNpwp.trim() !== '' && /[0-9]/.test(vendorAmount) && vendorDueDate.trim() !== '' && files['vendor-invoice'] != null;
  const isIndividualComplete =
    isStep2HeaderComplete &&
    indActivity.trim() !== '' &&
    indReceiver.trim() !== '' &&
    individualRole !== '' &&
    (individualRole !== 'Other' || indOtherRole.trim() !== '') &&
    indBankName.trim() !== '' &&
    indAccNumber.trim() !== '' &&
    indComponent.trim() !== '' &&
    /[0-9]/.test(indAmount) &&
    files['ind-ktp'] != null;
  const isPerDiemComplete =
    isStep2HeaderComplete && perDiemEvent.trim() !== '' && perDiemParticipants.trim() !== '' && files['perdiem-file'] != null;

  const handleSubmitPayment = async () => {
    const kategoriMap: Record<string, string> = {
      Vendor: PAYMENT_KATEGORI.VENDOR,
      'Individual(s)': PAYMENT_KATEGORI.INDIVIDUAL,
      'Per Diem': PAYMENT_KATEGORI.PER_DIEM,
    };

    // Normalisasi nominal: buang pemisah ribuan/titik sehingga murni angka untuk API.
    const normalizeAmount = (v: string) => v.replace(/[^0-9]/g, '');
    const nominal =
      paymentFor === 'Vendor' ? normalizeAmount(vendorAmount)
      : paymentFor === 'Individual(s)' ? normalizeAmount(indAmount)
      : 0;

    const projectID =
      paymentFor === 'Vendor' ? vendorName
      : paymentFor === 'Individual(s)' ? indActivity
      : perDiemEvent;

    const catatan =
      paymentFor === 'Vendor' ? `NPWP: ${vendorNpwp}`
      : paymentFor === 'Individual(s)' ? indReceiver
      : '';

    const detail =
      paymentFor === 'Vendor'
        ? JSON.stringify({ type: 'Vendor', submittingAs, emailTerkait, chargecode, paymentUnder, vendorName, vendorNpwp, vendorDueDate })
        : paymentFor === 'Individual(s)'
        ? JSON.stringify({
            type: 'Individual(s)',
            submittingAs,
            emailTerkait,
            chargecode,
            paymentUnder,
            indActivity,
            indReceiver,
            individualRole: individualRole === 'Other' ? indOtherRole : individualRole,
            indBankName,
            indAccNumber,
            indComponent,
          })
        : JSON.stringify({ type: 'Per Diem', submittingAs, emailTerkait, chargecode, paymentUnder, perDiemEvent, perDiemParticipants });

    const fd = new FormData();
    fd.append('projectID', projectID || 'Pending Detail');
    fd.append('nominal', String(nominal || 0));
    fd.append('idKategoriPayment', kategoriMap[paymentFor] ?? 'KPY03');
    fd.append('catatan', catatan);
    fd.append('detail', detail);
    fd.append('partnerDepartment', partnerList.find((p) => p.nama === partner)?.department ?? '');
    Object.entries(files).forEach(([key, f]) => f && fd.append(key, f));

    setUploadPct(0);
    try {
      const res = await uploadWithProgress('/api/payment', fd, setUploadPct);

      const data = await res.json();
      await new Promise((r) => setTimeout(r, 350)); // let the "Upload Complete" state be visible briefly

      if (res.ok) {
        setMessage({ ok: true, text: `Payment submitted successfully! Type: ${paymentFor}, Status: Pending Ops` });
        setStep(1);
        setSubmittingAs('');
        setEmailTerkait('');
        setPaymentFor('');
        setChargecode('');
        setPartner('');
        setPaymentUnder('');
        const list = await fetch('/api/payment/list?scope=mine', { cache: 'no-store' });
        if (list.ok) {
          const ldata = await list.json();
          setOutgoingPayments(mapOutgoingPayments((ldata.list ?? []) as Record<string, unknown>[]));
        }
      } else {
        setMessage({ ok: false, text: data.error || 'Failed to submit request' });
      }
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : 'Network error' });
    } finally {
      setUploadPct(null);
    }
  };

  return (
    <>
    <div className="w-full h-full flex flex-col gap-3">
      <PageTopBar showGreeting />

      {step === 1 && (
        <motion.div
          initial={false}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, ease: easeOut }}
          className="flex-1 min-h-0 flex flex-col gap-3"
        >
          {outgoingPayments.length > 0 && (
            <SearchPanel
              title="Search Outgoing Payments"
              subtitle="Filter by Chargecode, Project Manager, or Submitted Date."
              onReset={handleReset}
              onSearch={handleSearch}
            >
              <ComboboxField
                label="Chargecode"
                value={draft.chargecode}
                onChange={(v) => setField('chargecode', v)}
                options={CHARGECODE_OPTIONS}
                placeholder="Type or select chargecode..."
              />
              <SearchTextField label="Project Manager" value={draft.pm} onChange={(v) => setField('pm', v)} placeholder="Search..." />
              <SearchDateRangeCalendarField
                label="Submitted Date"
                fromValue={draft.from}
                toValue={draft.to}
                onFromChange={(v) => setField('from', v)}
                onToChange={(v) => setField('to', v)}
              />
            </SearchPanel>
          )}

          <SectionCard title="Outgoing Payments" scroll>
            {outgoingPayments.length === 0 ? (
              <p className="py-8 text-center text-[14px] text-amana-neutral-400 font-medium">
                {loadingPayments ? 'Loading data...' : "You haven't requested any payments yet"}
              </p>
            ) : (
              <DataTable columns={paymentColumns} rows={filteredPayments} defaultSortKey="timeSubmission" defaultSortDir="desc" emptyMessage="No payments match your filters." compact />
            )}
          </SectionCard>

          <SectionCard title="Payment Request">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <TextField label="Project Manager" value={submittingAs} onChange={setSubmittingAs} placeholder="e.g. Siti Inertia" />
              <TextField label="Related Email" type="email" value={emailTerkait} onChange={setEmailTerkait} placeholder="name@amana.id" />
            </div>
            <div className="flex justify-end mt-5 pt-4 border-t border-amana-neutral-200">
              <Button variant="primary" size="lg" disabled={!isStep1Complete} onClick={() => setStep(2)}>
                Next
              </Button>
            </div>
          </SectionCard>
        </motion.div>
      )}

      {step === 2 && (
        <motion.div
          initial={false}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, ease: easeOut }}
          className="flex-1 min-h-0 flex flex-col"
        >
          <SectionCard scroll className="overflow-y-auto scroll-smooth">
            <div className="flex-shrink-0 flex items-center gap-3 pb-1.5 mb-3 border-b border-amana-primary-500">
              <button onClick={() => setStep(1)} className="text-amana-primary-500 hover:text-amana-danger-500">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h3 className="text-[20px] font-semibold text-amana-primary-500">Step 2: Payment Details</h3>
            </div>

            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ComboboxField
                  label="Chargecode"
                  value={chargecode}
                  onChange={setChargecode}
                  options={CHARGECODE_OPTIONS}
                  placeholder="Type or select chargecode..."
                />
                <div className="flex flex-col gap-1.5">
                  <label className="text-[16px] font-semibold text-amana-neutral-500">Related Partner</label>
                  <div className="w-full border border-amana-neutral-300 rounded-[8px] px-3 py-2.5 text-[16px] bg-amana-neutral-200">
                    {partner ? (
                      <span className="text-amana-neutral-500">{partner}</span>
                    ) : (
                      <span className="text-amana-neutral-300">Select chargecode first...</span>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <SelectField
                  label="Payment Under"
                  value={paymentUnder}
                  onChange={setPaymentUnder}
                  options={['PT Janji Cahaya Kembar', 'Yayasan Mitra Cahaya Amanah']}
                />
                {paymentUnder === 'Yayasan Mitra Cahaya Amanah' && (
                  <p className="text-[13px] text-amana-neutral-400 mt-1.5">
                    Yayasan payments are processed every Wednesday.
                  </p>
                )}
                {paymentUnder === 'PT Janji Cahaya Kembar' && (
                  <p className="text-[13px] text-amana-neutral-400 mt-1.5">
                    PT payments are processed on the 10th–25th of every month.
                  </p>
                )}
              </div>
              <SelectField
                label="To whom is this payment for"
                value={paymentFor}
                onChange={(v) => {
                  setPaymentFor(v);
                  setIndividualRole('');
                }}
                options={['Vendor', 'Individual(s)', 'Per Diem']}
                placeholder="Select Payment Type..."
              />

              {paymentFor === 'Vendor' && (
                <div className="flex flex-col gap-4">
                  <TextField label="Vendor Name" value={vendorName} onChange={setVendorName} placeholder="Enter vendor name" />
                  <TextField
                    label="NPWP Vendor"
                    type="text"
                    inputMode="numeric"
                    value={vendorNpwp}
                    onChange={(v) => setVendorNpwp(v.replace(/[^0-9.-]/g, ''))}
                    placeholder="e.g. 01.234.567.8-012.000"
                  />
                  <TextField
                    label="Payment Amount"
                    type="text"
                    inputMode="numeric"
                    value={vendorAmount}
                    onChange={(v) => setVendorAmount(v.replace(/[^0-9.]/g, ''))}
                    placeholder="e.g. 1500000"
                  />
                  <DateField label="Due Date" value={vendorDueDate} onChange={setVendorDueDate} />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[16px] font-semibold text-amana-neutral-500">Attach Invoice</label>
                    <UploadBox label="Upload Invoice Document (.pdf)" fileKey="vendor-invoice" files={files} onFileChange={handleFileChange} />
                  </div>
                  <div className="flex justify-end pt-4 border-t border-amana-neutral-200">
                    <Button variant="primary" size="lg" disabled={!isVendorComplete} onClick={handleSubmitPayment}>
                      Submit Payment
                    </Button>
                  </div>
                </div>
              )}

              {paymentFor === 'Individual(s)' && (
                <div className="flex flex-col gap-4">
                  <TextField label="Name of Activity" value={indActivity} onChange={setIndActivity} placeholder="Activity name" />
                  <TextField label="Name of the Honor Receiver" value={indReceiver} onChange={setIndReceiver} placeholder="Receiver name" />
                  <div className="flex flex-col gap-1.5">
                    <SelectField
                      label="Their role in this event"
                      value={individualRole}
                      onChange={setIndividualRole}
                      options={['Speaker', 'Moderator', 'Language Interpreter', 'Other']}
                      placeholder="Select role..."
                    />
                    {individualRole === 'Other' && (
                      <input
                        value={indOtherRole}
                        onChange={(e) => setIndOtherRole(e.target.value)}
                        placeholder="Please specify role..."
                        className="w-full border border-amana-neutral-300 rounded-[13px] px-3 py-2.5 text-[16px] text-amana-neutral-500 placeholder:text-amana-neutral-300 transition-colors duration-200 focus:outline-none focus:border-amana-primary-500"
                      />
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextField label="Bank Account Name" value={indBankName} onChange={setIndBankName} placeholder="Account Name" />
                    <TextField
                      label="Bank Account Number"
                      type="text"
                      inputMode="numeric"
                      value={indAccNumber}
                      onChange={(v) => setIndAccNumber(v.replace(/[^0-9.-]/g, ''))}
                      placeholder="Account Number"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextField label="Honor Components" value={indComponent} onChange={setIndComponent} placeholder="Component" />
                    <TextField
                      label="Amount"
                      type="text"
                      inputMode="numeric"
                      value={indAmount}
                      onChange={(v) => setIndAmount(v.replace(/[^0-9.]/g, ''))}
                      placeholder="Rp"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[16px] font-semibold text-amana-neutral-500">
                      Copy of Individual KTP <span className="font-normal text-amana-neutral-400 ml-1">(For tax purposes)</span>
                    </label>
                    <UploadBox label="Upload KTP Document (.pdf)" fileKey="ind-ktp" files={files} onFileChange={handleFileChange} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[16px] font-semibold text-amana-neutral-500">
                      Attach Invoice <span className="font-normal text-amana-neutral-400 ml-1">(Optional)</span>
                    </label>
                    <UploadBox label="Upload Invoice Document (.pdf)" fileKey="ind-invoice" files={files} onFileChange={handleFileChange} />
                  </div>
                  <div className="flex justify-end pt-4 border-t border-amana-neutral-200">
                    <Button variant="primary" size="lg" disabled={!isIndividualComplete} onClick={handleSubmitPayment}>
                      Submit Payment
                    </Button>
                  </div>
                </div>
              )}

              {paymentFor === 'Per Diem' && (
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextField label="Name of Event" value={perDiemEvent} onChange={setPerDiemEvent} placeholder="Event Name" />
                    <TextField
                      label="Number of Participants"
                      type="number"
                      value={perDiemParticipants}
                      onChange={setPerDiemParticipants}
                      placeholder="E.g. 50"
                    />
                  </div>
                  <div className="bg-amana-neutral-100 rounded-[13px] p-4 border border-amana-neutral-300">
                    <h4 className="text-[16px] font-semibold text-amana-primary-500 mb-2">Upload file with participant details</h4>
                    <p className="text-xs text-amana-neutral-400 mb-3">Please ensure the document includes the following columns:</p>
                    <div className="grid grid-cols-2 gap-y-2 text-xs text-amana-neutral-500 font-semibold mb-4">
                      {['Full Name', 'Phone Number', 'Organization', 'Bank Account Name', 'Bank Account Number', 'Amount'].map((label, i) => (
                        <p key={label} className="flex items-center gap-2">
                          <span className="w-4 h-4 rounded-full bg-amana-primary-500 flex items-center justify-center text-amana-neutral-100 text-[9px]">
                            {i + 1}
                          </span>
                          {label}
                        </p>
                      ))}
                    </div>
                    <div className="rounded-[13px] overflow-hidden border border-amana-neutral-300 bg-amana-neutral-100 p-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/perdiem.png" alt="Format Example" className="w-full h-auto rounded-[8px]" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[16px] font-semibold text-amana-neutral-500">Upload The File Here</label>
                    <UploadBox label="Upload Participant List (.pdf)" fileKey="perdiem-file" files={files} onFileChange={handleFileChange} />
                  </div>
                  <div className="flex justify-end pt-4 border-t border-amana-neutral-200">
                    <Button variant="primary" size="lg" disabled={!isPerDiemComplete} onClick={handleSubmitPayment}>
                      Submit Payment
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </SectionCard>
        </motion.div>
      )}
    </div>

    <StatusModal state={message} onClose={() => setMessage(null)} />
    <UploadProgressModal open={uploadPct !== null} percent={uploadPct ?? 0} />
    <PaymentDetailModal open={!!detailRow} row={detailRow} onClose={() => setDetailRow(null)} />
    </>
  );
}