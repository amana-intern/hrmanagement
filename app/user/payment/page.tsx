'use client';

import { useState } from 'react';
import SidebarUser from '../../components/navigation/SidebarUser/Sidebaruser';
import { PageLayout } from '../../components/layout';
import { Button, Input, Select, FormField, FileUpload, FormActions } from '../../components/forms';
import { GoBackButton } from '../../components/feedback';
import { Card } from '../../components/cards';
import { Table } from '../../components/tables';
import { Badge, EmptyState } from '../../components/feedback';

interface OutgoingPayment {
  id: number;
  timeSubmission: string;
  toWhom: 'Vendor' | 'Individual' | 'Per Diem';
  submittedToWhom: string;
  status: 'Pending Ops' | 'Pending Partner' | 'Scheduled' | 'Rejected' | 'Done';
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

  const [outgoingPayments] = useState<OutgoingPayment[]>([
    { id: 1, timeSubmission: '23 Jul 2026', toWhom: 'Vendor',     submittedToWhom: 'PT Janji Cahaya Kembar',        status: 'Pending Ops' },
    { id: 2, timeSubmission: '20 Jul 2026', toWhom: 'Individual', submittedToWhom: 'Workshop Digital Marketing',    status: 'Done' },
    { id: 3, timeSubmission: '18 Jul 2026', toWhom: 'Per Diem',   submittedToWhom: 'Team Building 2026',            status: 'Pending Partner' },
    { id: 4, timeSubmission: '15 Jul 2026', toWhom: 'Vendor',     submittedToWhom: 'PT Solusi Teknologi',           status: 'Scheduled' },
    { id: 5, timeSubmission: '10 Jul 2026', toWhom: 'Individual', submittedToWhom: 'Seminar Pendidikan Nasional',   status: 'Rejected' },
  ]);

  const statusVariant = (s: OutgoingPayment['status']) =>
    s === 'Pending Ops' ? 'warning' : s === 'Pending Partner' ? 'info' : s === 'Scheduled' ? 'success' : s === 'Rejected' ? 'rejected' : 'approved';

  const paymentColumns = [
    { key: 'time', label: 'Time Submission' },
    { key: 'toWhom', label: 'To Whom' },
    { key: 'submitted', label: 'Submitted To Whom' },
    { key: 'status', label: 'Status', align: 'center' as const },
  ];

  const handleFileChange = (key: string, file: File | null) => {
    setFiles((prev) => ({ ...prev, [key]: file }));
  };

  const isVendorComplete = vendorName.trim() !== '' && vendorNpwp.trim() !== '' && vendorAmount.trim() !== '' && vendorDueDate.trim() !== '' && files['vendor-invoice'] !== null;
  const isIndividualComplete = indActivity.trim() !== '' && indReceiver.trim() !== '' && individualRole !== '' && (individualRole !== 'Other' || indOtherRole.trim() !== '') && indBankName.trim() !== '' && indAccNumber.trim() !== '' && indComponent.trim() !== '' && indAmount.trim() !== '' && files['ind-ktp'] !== null;
  const isPerDiemComplete = perDiemEvent.trim() !== '' && perDiemParticipants.trim() !== '' && files['perdiem-file'] !== null;

  const handleSubmitPayment = () => {
    alert(`Payment submitted successfully!\n\nType: ${paymentFor}`);
  };

  return (
    <PageLayout sidebar={<SidebarUser />}>
      <div className="animate-slide-up delay-100 flex flex-col gap-6">
        {step === 1 && (
          <>
            <Card padding="lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-6 bg-amana-blue rounded-full" />
                <h3 className="text-lg font-semibold text-amana-black">Outgoing Payments</h3>
              </div>
              {outgoingPayments.length === 0 ? (
                <EmptyState message="You haven&apos;t requested any payments yet" />
              ) : (
                <Table columns={paymentColumns}>
                  {outgoingPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-amana-blue/[0.03] transition-colors duration-200">
                      <td className="p-4 font-semibold text-amana-black whitespace-nowrap">{p.timeSubmission}</td>
                      <td className="p-4 text-amana-sec-7">{p.toWhom}</td>
                      <td className="p-4 text-amana-black">{p.submittedToWhom}</td>
                      <td className="p-4 text-center"><Badge variant={statusVariant(p.status)}>{p.status}</Badge></td>
                    </tr>
                  ))}
                </Table>
              )}
            </Card>

            <Card padding="lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-6 bg-amana-blue rounded-full" />
                <h3 className="text-lg font-semibold text-amana-black">General Payment</h3>
              </div>
              <div className="space-y-4">
                <FormField label="Submitting as" labelClassName="text-amana-blue text-lg mb-1 block">
                  <Select value={role} onChange={(e) => setRole(e.target.value)} className="border-amana-sec-5 text-amana-blue">
                    <option value="" disabled>Click for select...</option>
                    <option value="Consultant">Consultant</option>
                    <option value="Project Manager">Project Manager</option>
                  </Select>
                </FormField>
                <FormField label="Practice Group" labelClassName="text-amana-blue text-lg mb-1 block">
                  <Select value={practiceGroup} onChange={(e) => setPracticeGroup(e.target.value)} className="border-amana-sec-5 text-amana-blue">
                    <option value="" disabled>Click for select...</option>
                    <option value="Education">Education</option>
                    <option value="Digital">Digital</option>
                    <option value="Strategy and Transformation">Strategy and Transformation</option>
                    <option value="Health and Wellbeing">Health and Wellbeing</option>
                    <option value="Operations">Operations</option>
                  </Select>
                </FormField>
                <FormField label="Related Partner" labelClassName="text-amana-blue text-lg mb-1 block">
                  <Select value={partner} onChange={(e) => setPartner(e.target.value)} className="border-amana-sec-5 text-amana-blue">
                    <option value="" disabled>Click for select...</option>
                    <option value="Nya' Zata Amani">Nya&apos; Zata Amani (Education / Health)</option>
                    <option value="Prasetya Dwicahya">Prasetya Dwicahya (Strategy &amp; Transformation)</option>
                    <option value="Endiyan Rakhmanda">Endiyan Rakhmanda (Digital)</option>
                    <option value="Kevin Tan">Kevin Tan (Operationals)</option>
                  </Select>
                </FormField>
                <FormField label="Payment Under" labelClassName="text-amana-blue text-lg mb-1 block">
                  <Select value={paymentUnder} onChange={(e) => setPaymentUnder(e.target.value)} className="border-amana-sec-5 text-amana-blue">
                    <option value="" disabled>Click for select...</option>
                    <option value="PT Janji Cahaya Kembar">PT Janji Cahaya Kembar</option>
                    <option value="Yayasan Mitra Cahaya Amanah">Yayasan Mitra Cahaya Amanah</option>
                  </Select>
                </FormField>
              </div>
              <FormActions>
                <Button disabled={!isStep1Complete} onClick={() => setStep(2)} variant="secondary" className="rounded-full px-8">Next</Button>
              </FormActions>
            </Card>
          </>
        )}

        {step === 2 && (
          <Card padding="lg">
            <div className="flex items-center gap-3 mb-4 border-b border-amana-sec-6 pb-3">
              <GoBackButton onClick={() => setStep(1)} />
              <h2 className="text-lg font-semibold text-amana-blue">Step 2: Payment Details</h2>
            </div>

            <FormField label="To whom is this payment for" labelClassName="text-amana-blue text-lg mb-1 block">
              <Select value={paymentFor} onChange={(e) => { setPaymentFor(e.target.value); setIndividualRole(''); }} className="border-amana-sec-5 text-amana-blue">
                <option value="" disabled>Select Payment Type...</option>
                <option value="Vendor">Vendor</option>
                <option value="Individual(s)">Individual(s)</option>
                <option value="Per Diem">Per Diem</option>
              </Select>
            </FormField>

            {paymentFor === 'Vendor' && (
              <div className="space-y-4 animate-fade-in">
                <FormField label="Vendor Name"><Input value={vendorName} onChange={(e) => setVendorName(e.target.value)} placeholder="Enter vendor name" className="border-amana-sec-5 text-amana-blue" /></FormField>
                <FormField label="NPWP Vendor"><Input type="number" value={vendorNpwp} onChange={(e) => setVendorNpwp(e.target.value)} placeholder="Enter NPWP" className="border-amana-sec-5 text-amana-blue" /></FormField>
                <FormField label="Payment Amount"><Input type="number" value={vendorAmount} onChange={(e) => setVendorAmount(e.target.value)} placeholder="e.g. 1500000" className="border-amana-sec-5 text-amana-blue" /></FormField>
                <FormField label="Due Date"><Input type="date" value={vendorDueDate} onChange={(e) => setVendorDueDate(e.target.value)} className="border-amana-sec-5 text-amana-blue" /></FormField>
                <FormField label="Attach Invoice"><FileUpload label="UPLOAD INVOICE DOCUMENT (.PDF)" file={files['vendor-invoice']} onChange={(f) => handleFileChange('vendor-invoice', f)} /></FormField>
                <FormActions>
                  <Button disabled={!isVendorComplete} onClick={handleSubmitPayment}>Submit Payment</Button>
                </FormActions>
              </div>
            )}

            {paymentFor === 'Individual(s)' && (
              <div className="space-y-4 animate-fade-in">
                <FormField label="Name of Activity"><Input value={indActivity} onChange={(e) => setIndActivity(e.target.value)} placeholder="Activity name" className="border-amana-sec-5 text-amana-blue" /></FormField>
                <FormField label="Name of the Honor Receiver"><Input value={indReceiver} onChange={(e) => setIndReceiver(e.target.value)} placeholder="Receiver name" className="border-amana-sec-5 text-amana-blue" /></FormField>
                <FormField label="Their role in this event">
                  <Select value={individualRole} onChange={(e) => setIndividualRole(e.target.value)} className="border-amana-sec-5 text-amana-blue">
                    <option value="" disabled>Select role...</option>
                    <option value="Speaker">Speaker</option>
                    <option value="Moderator">Moderator</option>
                    <option value="Language Interpreter">Language Interpreter</option>
                    <option value="Other">Other (specify)</option>
                  </Select>
                  {individualRole === 'Other' && (
                    <Input value={indOtherRole} onChange={(e) => setIndOtherRole(e.target.value)} placeholder="Please specify role..." className="mt-2 border-amana-sec-5 text-amana-blue" />
                  )}
                </FormField>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FormField label="Bank Account Name"><Input value={indBankName} onChange={(e) => setIndBankName(e.target.value)} placeholder="Account Name" className="border-amana-sec-5 text-amana-blue" /></FormField>
                  <FormField label="Bank Account Number"><Input type="number" value={indAccNumber} onChange={(e) => setIndAccNumber(e.target.value)} placeholder="Account Number" className="border-amana-sec-5 text-amana-blue" /></FormField>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FormField label="Honor Components"><Input value={indComponent} onChange={(e) => setIndComponent(e.target.value)} placeholder="Component" className="border-amana-sec-5 text-amana-blue" /></FormField>
                  <FormField label="Amount"><Input type="number" value={indAmount} onChange={(e) => setIndAmount(e.target.value)} placeholder="Rp" className="border-amana-sec-5 text-amana-blue" /></FormField>
                </div>
                <FormField label="Copy of Individual KTP" helperText="For tax purposes"><FileUpload label="UPLOAD KTP DOCUMENT (.PDF)" file={files['ind-ktp']} onChange={(f) => handleFileChange('ind-ktp', f)} /></FormField>
                <FormField label="Attach Invoice" helperText="Optional"><FileUpload label="UPLOAD INVOICE DOCUMENT (.PDF)" file={files['ind-invoice']} onChange={(f) => handleFileChange('ind-invoice', f)} /></FormField>
                <FormActions>
                  <Button disabled={!isIndividualComplete} onClick={handleSubmitPayment}>Submit Payment</Button>
                </FormActions>
              </div>
            )}

            {paymentFor === 'Per Diem' && (
              <div className="space-y-4 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FormField label="Name of Event"><Input value={perDiemEvent} onChange={(e) => setPerDiemEvent(e.target.value)} placeholder="Event Name" className="border-amana-sec-5 text-amana-blue" /></FormField>
                  <FormField label="Number of Participants"><Input type="number" value={perDiemParticipants} onChange={(e) => setPerDiemParticipants(e.target.value)} placeholder="E.g. 50" className="border-amana-sec-5 text-amana-blue" /></FormField>
                </div>
                <div className="bg-amana-white rounded-xl p-4 border border-amana-sec-6">
                  <h3 className="text-base font-semibold text-amana-blue mb-2">Upload file with participant details</h3>
                  <p className="text-xs text-amana-sec-7-5 mb-3">Please ensure the document includes:</p>
                  <div className="grid grid-cols-2 gap-y-1 text-xs text-amana-black font-semibold mb-4">
                    <p>1. Full Name</p><p>2. Phone Number</p>
                    <p>3. Organization</p><p>4. Bank Account Name</p>
                    <p>5. Bank Account Number</p><p>6. Amount</p>
                  </div>
                  <img src="/perdiem.png" alt="Format Example" className="w-full rounded-lg border border-amana-sec-6 shadow-xs" />
                </div>
                <FormField label="Upload The File Here"><FileUpload label="UPLOAD PARTICIPANT LIST (.PDF)" file={files['perdiem-file']} onChange={(f) => handleFileChange('perdiem-file', f)} /></FormField>
                <FormActions>
                  <Button disabled={!isPerDiemComplete} onClick={handleSubmitPayment}>Submit Payment</Button>
                </FormActions>
              </div>
            )}
          </Card>
        )}
      </div>
    </PageLayout>
  );
}
