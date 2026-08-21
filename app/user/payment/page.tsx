'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import PageTopBar from '../../components/layout/PageTopBar';
import SectionCard from '../../components/layout/SectionCard';
import DataTable, { type DataTableColumn } from '../../components/data-display/DataTable';
import StatusPill from '../../components/data-display/StatusPill';
import Button from '../../components/forms/Button';
import TextField from '../../components/forms/TextField';
import SelectField from '../../components/forms/SelectField';
import SharedUploadBox from '../../components/forms/UploadBox';
import { easeOut } from '@/app/utils/motion';
import { formatDateTimeWIB } from '@/app/utils/formatDate';
import { DEPARTMENT_LABEL } from '@/lib/roles';
import { useRole, isAdminRole } from '@/app/utils/useRole';
import { PAYMENT_KATEGORI, PAYMENT_STATUS } from '@/lib/constants';

interface OutgoingPayment {
  id: string;
  timeSubmission: string | null;
  toWhom: string | null;
  submittedToWhom: string | null;
  requester: string | null;
  department: string | null;
  partner: string | null;
  paymentUnder: string | null;
  idStatus: string | null;
  namaStatus: string | null;
}

function parseDetail(detail?: string | null): Record<string, string> {
  if (!detail) return {};
  try {
    const parsed = JSON.parse(detail);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function mapOutgoingPayment(p: Record<string, unknown>): OutgoingPayment {
  const detail = parseDetail((p as { detail?: string | null }).detail ?? null);
  const karyawan = (p as { karyawan?: { nama?: string | null; department?: string | null } | null }).karyawan;
  return {
    id: (p as { idRequest?: string }).idRequest ?? String(Math.random()),
    timeSubmission: (p as { createdAt?: string | null }).createdAt ?? null,
    toWhom: (p as { masterKategoriPayment?: { namaKategori?: string | null } | null }).masterKategoriPayment?.namaKategori ?? null,
    submittedToWhom: (p as { projectID?: string | null }).projectID ?? null,
    requester: karyawan?.nama ?? null,
    department: karyawan?.department ? DEPARTMENT_LABEL[karyawan.department] ?? karyawan.department : null,
    partner: detail.partner ?? null,
    paymentUnder: detail.paymentUnder ?? null,
    idStatus: (p as { idStatus?: string | null }).idStatus ?? null,
    namaStatus: (p as { masterStatus?: { namaStatus?: string | null } | null }).masterStatus?.namaStatus ?? null,
  };
}

function statusColor(s: string | null): string {
  switch (s) {
    case PAYMENT_STATUS.PENDING_OPS:
      return 'bg-amana-warning-500';
    case PAYMENT_STATUS.PENDING_PARTNER:
      return 'bg-amana-primary-500';
    case PAYMENT_STATUS.REJECTED:
      return 'bg-amana-danger-500';
    default:
      return 'bg-amana-success-500';
  }
}

const paymentColumns: DataTableColumn<OutgoingPayment>[] = [
  {
    key: 'timeSubmission',
    label: 'Time Submission',
    render: (r) => formatDateTimeWIB(r.timeSubmission),
    sortValue: (r) => (r.timeSubmission ? new Date(r.timeSubmission).getTime() : 0),
  },
  { key: 'requester', label: 'Requester' },
  { key: 'department', label: 'Department' },
  { key: 'partner', label: 'Partner' },
  { key: 'paymentUnder', label: 'Payment Under' },
  { key: 'toWhom', label: 'To Whom' },
  { key: 'submittedToWhom', label: 'Event/Vendor Name' },
  {
    key: 'idStatus',
    label: 'Status',
    render: (r) => <StatusPill color={statusColor(r.idStatus)}>{r.namaStatus ?? r.idStatus ?? '-'}</StatusPill>,
  },
];

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
  const userRole = useRole();
  const isAdmin = isAdminRole(userRole);
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('');
  const [practiceGroup, setPracticeGroup] = useState('');
  const [partner, setPartner] = useState('');
  const [paymentUnder, setPaymentUnder] = useState('');
  const isStep1Complete = role !== '' && practiceGroup !== '' && partner !== '' && paymentUnder !== '';

  const [paymentFor, setPaymentFor] = useState('');
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

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/payment/list?scope=mine', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setOutgoingPayments(((data.list ?? []) as Record<string, unknown>[]).map(mapOutgoingPayment));
        }
      } catch {}
      setLoadingPayments(false);
    })();
  }, []);

  const handleFileChange = (key: string, file: File | null) => {
    setFiles((prev) => ({ ...prev, [key]: file }));
  };

  const isVendorComplete =
    vendorName.trim() !== '' && vendorNpwp.trim() !== '' && vendorAmount.trim() !== '' && vendorDueDate.trim() !== '' && files['vendor-invoice'] != null;
  const isIndividualComplete =
    indActivity.trim() !== '' &&
    indReceiver.trim() !== '' &&
    individualRole !== '' &&
    (individualRole !== 'Other' || indOtherRole.trim() !== '') &&
    indBankName.trim() !== '' &&
    indAccNumber.trim() !== '' &&
    indComponent.trim() !== '' &&
    indAmount.trim() !== '' &&
    files['ind-ktp'] != null;
  const isPerDiemComplete = perDiemEvent.trim() !== '' && perDiemParticipants.trim() !== '' && files['perdiem-file'] != null;

  const handleSubmitPayment = async () => {
    const kategoriMap: Record<string, string> = {
      Vendor: PAYMENT_KATEGORI.VENDOR,
      'Individual(s)': PAYMENT_KATEGORI.INDIVIDUAL,
      'Per Diem': PAYMENT_KATEGORI.PER_DIEM,
    };

    const nominal =
      paymentFor === 'Vendor' ? vendorAmount
      : paymentFor === 'Individual(s)' ? indAmount
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
        ? JSON.stringify({ type: 'Vendor', vendorName, vendorNpwp, vendorDueDate, role, practiceGroup, partner, paymentUnder })
        : paymentFor === 'Individual(s)'
        ? JSON.stringify({
            type: 'Individual(s)',
            indActivity,
            indReceiver,
            individualRole: individualRole === 'Other' ? indOtherRole : individualRole,
            indBankName,
            indAccNumber,
            indComponent,
            role,
            practiceGroup,
            partner,
            paymentUnder,
          })
        : JSON.stringify({ type: 'Per Diem', perDiemEvent, perDiemParticipants, role, practiceGroup, partner, paymentUnder });

    const fd = new FormData();
    fd.append('projectID', projectID || 'Pending Detail');
    fd.append('nominal', String(nominal || 0));
    fd.append('idKategoriPayment', kategoriMap[paymentFor] ?? 'KPY03');
    fd.append('catatan', catatan);
    fd.append('detail', detail);
    Object.entries(files).forEach(([key, f]) => f && fd.append(key, f));

    try {
      const res = await fetch('/api/payment', {
        method: 'POST',
        body: fd,
      });

      const data = await res.json();
      if (res.ok) {
        alert(`Payment submitted successfully!\n\nType: ${paymentFor}\nStatus: Pending Ops`);
        setStep(1);
        setRole('');
        setPracticeGroup('');
        setPartner('');
        setPaymentUnder('');
        setPaymentFor('');
        const list = await fetch('/api/payment/list?scope=mine', { cache: 'no-store' });
        if (list.ok) {
          const ldata = await list.json();
          setOutgoingPayments(((ldata.list ?? []) as Record<string, unknown>[]).map(mapOutgoingPayment));
        }
      } else {
        alert(data.error || 'Failed to submit request');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Network error');
    }
  };

  return (
    <div className="w-full h-full flex flex-col gap-3">
      <PageTopBar showGreeting section={isAdmin ? 'Payment' : 'Services'} page={isAdmin ? 'Payment Request' : 'Request Payment'} />

      {step === 1 && (
        <motion.div
          initial={false}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, ease: easeOut }}
          className="flex-1 min-h-0 flex flex-col gap-3"
        >
          <SectionCard title="Outgoing Payments" scroll>
            {outgoingPayments.length === 0 ? (
              <p className="py-8 text-center text-[14px] text-amana-neutral-400 font-medium">
                {loadingPayments ? 'Loading data...' : "You haven't requested any payments yet"}
              </p>
            ) : (
              <DataTable columns={paymentColumns} rows={outgoingPayments} defaultSortKey="timeSubmission" />
            )}
          </SectionCard>

          <SectionCard title="Submit New Payment">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <SelectField label="Submitting as" value={role} onChange={setRole} options={['Consultant', 'Project Manager']} />
              <SelectField
                label="Practice Group"
                value={practiceGroup}
                onChange={setPracticeGroup}
                options={['Education', 'Digital', 'Strategy and Transformation', 'Health and Wellbeing', 'Operations']}
              />
              <SelectField
                label="Related Partner"
                value={partner}
                onChange={setPartner}
                options={["Nya' Zata Amani", 'Prasetya Dwicahya', 'Endiyan Rakhmanda', 'Kevin Tan']}
              />
              <SelectField
                label="Payment Under"
                value={paymentUnder}
                onChange={setPaymentUnder}
                options={['PT Janji Cahaya Kembar', 'Yayasan Mitra Cahaya Amanah']}
              />
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
                  <TextField label="NPWP Vendor" type="number" value={vendorNpwp} onChange={setVendorNpwp} placeholder="Enter NPWP" />
                  <TextField label="Payment Amount" type="number" value={vendorAmount} onChange={setVendorAmount} placeholder="e.g. 1500000" />
                  <TextField label="Due Date" type="date" value={vendorDueDate} onChange={setVendorDueDate} />
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
                    <TextField label="Bank Account Number" type="number" value={indAccNumber} onChange={setIndAccNumber} placeholder="Account Number" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextField label="Honor Components" value={indComponent} onChange={setIndComponent} placeholder="Component" />
                    <TextField label="Amount" type="number" value={indAmount} onChange={setIndAmount} placeholder="Rp" />
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
  );
}