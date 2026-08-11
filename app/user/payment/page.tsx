'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { PageTopBar, SectionCard, DataTable, Button, TextField, SelectField, StatusPill, UploadBox as SharedUploadBox } from '../../components/ui';
import { easeOut } from '@/app/utils/motion';
import type { DataTableColumn } from '../../components/ui';

type PaymentStatus = 'Pending Ops' | 'Pending Partner' | 'Scheduled' | 'Rejected' | 'Done';

interface OutgoingPayment {
  id: number;
  timeSubmission: string;
  toWhom: 'Vendor' | 'Individual' | 'Per Diem';
  submittedToWhom: string;
  status: PaymentStatus;
}

const outgoingPayments: OutgoingPayment[] = [
  { id: 1, timeSubmission: '23 July 2026', toWhom: 'Vendor', submittedToWhom: 'PT Janji Cahaya Kembar', status: 'Pending Ops' },
  { id: 2, timeSubmission: '20 July 2026', toWhom: 'Individual', submittedToWhom: 'Workshop Digital Marketing', status: 'Done' },
  { id: 3, timeSubmission: '18 July 2026', toWhom: 'Per Diem', submittedToWhom: 'Team Building 2026', status: 'Pending Partner' },
  { id: 4, timeSubmission: '15 July 2026', toWhom: 'Vendor', submittedToWhom: 'PT Solusi Teknologi', status: 'Scheduled' },
  { id: 5, timeSubmission: '10 July 2026', toWhom: 'Individual', submittedToWhom: 'Seminar Pendidikan Nasional', status: 'Rejected' },
];

const statusStyle: Record<PaymentStatus, string> = {
  'Pending Ops': 'bg-amana-warning-500',
  'Pending Partner': 'bg-amana-primary-500',
  Scheduled: 'bg-amana-success-500',
  Rejected: 'bg-amana-danger-500',
  Done: 'bg-amana-success-500',
};

const paymentColumns: DataTableColumn<OutgoingPayment>[] = [
  { key: 'timeSubmission', label: 'Time Submission', sortValue: (r) => new Date(r.timeSubmission).getTime() },
  { key: 'toWhom', label: 'To Whom' },
  { key: 'submittedToWhom', label: 'Submitted To Whom' },
  {
    key: 'status',
    label: 'Status',
    render: (r) => <StatusPill color={statusStyle[r.status]}>{r.status}</StatusPill>,
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

  const handleSubmitPayment = () => {
    alert(`Payment submitted successfully!\n\nType: ${paymentFor}`);
  };

  return (
      <div className="w-full h-full flex flex-col gap-3">
        <PageTopBar showGreeting section="Career Hub" page="Payment" />

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
                  You haven&apos;t requested any payments yet
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
