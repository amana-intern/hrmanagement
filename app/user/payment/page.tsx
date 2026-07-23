  'use client';

import { useState } from 'react';
import SidebarUser from '../../components/Sidebar/SidebarUser/Sidebaruser';
import { PageLayout, PageTitle, Card, CardSection, Button, Input, Select, Label, Table, Badge } from '../../components/ui';

interface OutgoingPayment {
  id: number;
  timeSubmission: string;
  toWhom: 'Vendor' | 'Individual' | 'Per Diem';
  submittedToWhom: string;
  status: 'Pending Ops' | 'Pending Partner' | 'Scheduled' | 'Rejected' | 'Done';
}

function UploadBox({ label, fileKey, files, onFileChange }: {
  label?: string;
  fileKey: string;
  files: { [key: string]: File | null };
  onFileChange: (key: string, file: File | null) => void;
}) {
  return (
    <div className="group relative w-full border-2 border-dashed border-amana-sec-6 rounded-xl p-6 flex flex-col items-center justify-center bg-amana-white hover:border-amana-blue/40 hover:bg-white transition-all duration-200 cursor-pointer mt-1">
      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => onFileChange(fileKey, e.target.files?.[0] || null)}
        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
      />
      <img src="/icon/BUpload.png" alt="" className="w-8 h-8 object-contain mb-2" />
      <span className="text-[11px] font-semibold text-amana-blue uppercase tracking-wider text-center truncate max-w-full px-2">
        {files[fileKey] ? files[fileKey]?.name : (label || 'UPLOAD INVOICE DOCUMENT (.PDF)')}
      </span>
    </div>
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
      <PageTitle>Payment</PageTitle>

      <div className="animate-slide-up delay-100 flex flex-col gap-6">
        
        {/* Step 1 & Dashboard View */}
        {step === 1 && (
          <>
            {/* Outgoing Payments Section */}
            <Card padding="lg" className="border border-amana-sec-5 rounded-3xl bg-white shadow-sm">
              <h2 className="text-base font-semibold text-amana-black mb-4">Outgoing Payments</h2>
              
              {outgoingPayments.length === 0 ? (
                <div className="flex justify-center items-center py-8">
                  <p className="text-sm text-amana-blue font-medium">You haven&apos;t requested any payments yet</p>
                </div>
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

            {/* Submitting Form Section */}
            <Card padding="lg" className="border border-amana-sec-5 rounded-3xl bg-white shadow-sm">
              <div className="space-y-4">
                <div>
                  <Label className="text-amana-blue text-lg mb-1 block">Submitting as</Label>
                  <Select value={role} onChange={(e) => setRole(e.target.value)} className="border-amana-sec-5 text-amana-blue">
                    <option value="" disabled>Click for select...</option>
                    <option value="Consultant">Consultant</option>
                    <option value="Project Manager">Project Manager</option>
                  </Select>
                </div>
                <div>
                  <Label className="text-amana-blue text-lg mb-1 block">Practice Group</Label>
                  <Select value={practiceGroup} onChange={(e) => setPracticeGroup(e.target.value)} className="border-amana-sec-5 text-amana-blue">
                    <option value="" disabled>Click for select...</option>
                    <option value="Education">Education</option>
                    <option value="Digital">Digital</option>
                    <option value="Strategy and Transformation">Strategy and Transformation</option>
                    <option value="Health and Wellbeing">Health and Wellbeing</option>
                    <option value="Operations">Operations</option>
                  </Select>
                </div>
                <div>
                  <Label className="text-amana-blue text-lg mb-1 block">Related Partner</Label>
                  <Select value={partner} onChange={(e) => setPartner(e.target.value)} className="border-amana-sec-5 text-amana-blue">
                    <option value="" disabled>Click for select...</option>
                    <option value="Nya' Zata Amani">Nya&apos; Zata Amani (Education / Health)</option>
                    <option value="Prasetya Dwicahya">Prasetya Dwicahya (Strategy &amp; Transformation)</option>
                    <option value="Endiyan Rakhmanda">Endiyan Rakhmanda (Digital)</option>
                    <option value="Kevin Tan">Kevin Tan (Operationals)</option>
                  </Select>
                </div>
                <div>
                  <Label className="text-amana-blue text-lg mb-1 block">Payment Under</Label>
                  <Select value={paymentUnder} onChange={(e) => setPaymentUnder(e.target.value)} className="border-amana-sec-5 text-amana-blue">
                    <option value="" disabled>Click for select...</option>
                    <option value="PT Janji Cahaya Kembar">PT Janji Cahaya Kembar</option>
                    <option value="Yayasan Mitra Cahaya Amanah">Yayasan Mitra Cahaya Amanah</option>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <Button 
                  disabled={!isStep1Complete} 
                  onClick={() => setStep(2)}
                  variant="secondary"
                  className="rounded-full px-8"
                >
                  Next
                </Button>
              </div>
            </Card>
          </>
        )}

        {/* Step 2 Form (Preserved) */}
        {step === 2 && (
          <Card padding="lg" className="border border-amana-sec-5 rounded-3xl bg-white shadow-sm">
            <div className="flex items-center gap-3 mb-4 border-b border-amana-sec-6 pb-3">
              <button onClick={() => setStep(1)} className="text-amana-sec-7 hover:text-amana-blue transition p-1 hover:bg-amana-blue/5 rounded-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="text-lg font-semibold text-amana-blue">Step 2: Payment Details</h2>
            </div>

            <div className="mb-4">
              <Label>To whom is this payment for</Label>
              <Select value={paymentFor} onChange={(e) => { setPaymentFor(e.target.value); setIndividualRole(''); }}>
                <option value="" disabled>Select Payment Type...</option>
                <option value="Vendor">Vendor</option>
                <option value="Individual(s)">Individual(s)</option>
                <option value="Per Diem">Per Diem</option>
              </Select>
            </div>

            {paymentFor === 'Vendor' && (
              <div className="space-y-4 animate-fade-in">
                <div><Label>Vendor Name</Label><Input value={vendorName} onChange={(e) => setVendorName(e.target.value)} placeholder="Enter vendor name" /></div>
                <div><Label>NPWP Vendor</Label><Input type="number" value={vendorNpwp} onChange={(e) => setVendorNpwp(e.target.value)} placeholder="Enter NPWP" /></div>
                <div><Label>Payment Amount</Label><Input type="number" value={vendorAmount} onChange={(e) => setVendorAmount(e.target.value)} placeholder="e.g. 1500000" /></div>
                <div><Label>Due Date</Label><Input type="date" value={vendorDueDate} onChange={(e) => setVendorDueDate(e.target.value)} /></div>
                <div><Label>Attach Invoice</Label><UploadBox label="UPLOAD INVOICE DOCUMENT (.PDF)" fileKey="vendor-invoice" files={files} onFileChange={handleFileChange} /></div>
                <div className="flex justify-end pt-4 border-t border-amana-sec-6">
                  <Button disabled={!isVendorComplete} onClick={handleSubmitPayment}>Submit Payment</Button>
                </div>
              </div>
            )}

            {paymentFor === 'Individual(s)' && (
              <div className="space-y-4 animate-fade-in">
                <div><Label>Name of Activity</Label><Input value={indActivity} onChange={(e) => setIndActivity(e.target.value)} placeholder="Activity name" /></div>
                <div><Label>Name of the Honor Receiver</Label><Input value={indReceiver} onChange={(e) => setIndReceiver(e.target.value)} placeholder="Receiver name" /></div>
                <div>
                  <Label>Their role in this event</Label>
                  <Select value={individualRole} onChange={(e) => setIndividualRole(e.target.value)}>
                    <option value="" disabled>Select role...</option>
                    <option value="Speaker">Speaker</option>
                    <option value="Moderator">Moderator</option>
                    <option value="Language Interpreter">Language Interpreter</option>
                    <option value="Other">Other (specify)</option>
                  </Select>
                  {individualRole === 'Other' && (
                    <Input value={indOtherRole} onChange={(e) => setIndOtherRole(e.target.value)} placeholder="Please specify role..." className="mt-2" />
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div><Label>Bank Account Name</Label><Input value={indBankName} onChange={(e) => setIndBankName(e.target.value)} placeholder="Account Name" /></div>
                  <div><Label>Bank Account Number</Label><Input type="number" value={indAccNumber} onChange={(e) => setIndAccNumber(e.target.value)} placeholder="Account Number" /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div><Label>Honor Components</Label><Input value={indComponent} onChange={(e) => setIndComponent(e.target.value)} placeholder="Component" /></div>
                  <div><Label>Amount</Label><Input type="number" value={indAmount} onChange={(e) => setIndAmount(e.target.value)} placeholder="Rp" /></div>
                </div>
                <div><Label>Copy of Individual KTP <span className="font-light text-amana-sec-7 ml-1">(For tax purposes)</span></Label><UploadBox label="UPLOAD KTP DOCUMENT (.PDF)" fileKey="ind-ktp" files={files} onFileChange={handleFileChange} /></div>
                <div><Label>Attach Invoice <span className="font-light text-amana-sec-7 ml-1">(Optional)</span></Label><UploadBox label="UPLOAD INVOICE DOCUMENT (.PDF)" fileKey="ind-invoice" files={files} onFileChange={handleFileChange} /></div>
                <div className="flex justify-end pt-4 border-t border-amana-sec-6">
                  <Button disabled={!isIndividualComplete} onClick={handleSubmitPayment}>Submit Payment</Button>
                </div>
              </div>
            )}

            {paymentFor === 'Per Diem' && (
              <div className="space-y-4 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div><Label>Name of Event</Label><Input value={perDiemEvent} onChange={(e) => setPerDiemEvent(e.target.value)} placeholder="Event Name" /></div>
                  <div><Label>Number of Participants</Label><Input type="number" value={perDiemParticipants} onChange={(e) => setPerDiemParticipants(e.target.value)} placeholder="E.g. 50" /></div>
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
                <div><Label>Upload The File Here</Label><UploadBox label="UPLOAD PARTICIPANT LIST (.PDF)" fileKey="perdiem-file" files={files} onFileChange={handleFileChange} /></div>
                <div className="flex justify-end pt-4 border-t border-amana-sec-6">
                  <Button disabled={!isPerDiemComplete} onClick={handleSubmitPayment}>Submit Payment</Button>
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
    </PageLayout>
  );
}