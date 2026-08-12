'use client';

import { useState } from 'react';
import { CalendarCheck } from 'lucide-react';
import { PageTopBar, SectionCard, StatBox, SelectField, TextField, Button } from '../../components/ui';

const leaveBalance = [
  { value: 12, label: 'Paid Leave', caption: 'Remaining Paid Leave Balance(s)' },
  { value: 0, label: 'Unpaid Leave', caption: 'Remaining Unpaid Leave Balance(s)' },
  { value: 0, label: 'Special Leave', caption: 'Remaining Special Leave Balance(s)' },
];

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

const leaveOptions = ['Paid Leave', 'Unpaid Leave', 'Special Leave'];

export default function LeaveRequestPage() {
  const [selectedLeave, setSelectedLeave] = useState('');
  const [selectedSpecialLeave, setSelectedSpecialLeave] = useState('');
  const [reason, setReason] = useState('');

  const isFormValid =
    selectedLeave !== '' &&
    (selectedLeave === 'Special Leave' ? selectedSpecialLeave !== '' : reason.trim() !== '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    alert('Leave request submitted successfully!');
  };

  return (
      <div className="w-full h-full flex flex-col gap-3">
        <PageTopBar showGreeting section="Services" page="Request Leave" />

        <SectionCard title="Leave Balance(s)">
          <div className="grid grid-cols-3 gap-4">
            {leaveBalance.map((stat) => (
              <StatBox key={stat.label} {...stat} />
            ))}
          </div>
        </SectionCard>

        <SectionCard as="form" onSubmit={handleSubmit} scroll>
          <div className="flex-shrink-0 flex items-center gap-2 pb-1.5 mb-2 border-b border-amana-primary-500">
            <h3 className="text-[20px] font-semibold text-amana-primary-500">Request Leave</h3>
            <CalendarCheck className="w-5 h-5 text-amana-primary-500" />
          </div>

          <div className="mb-5">
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
            <div className="mb-5">
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
            <div className="mb-5">
              <TextField
                label="Reason"
                value={reason}
                onChange={setReason}
                placeholder="Tell us the reason for your leave..."
              />
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-amana-neutral-200">
            <Button type="submit" variant="primary" size="lg" className="w-full max-w-[280px]" disabled={!isFormValid}>
              Submit
            </Button>
          </div>
        </SectionCard>
      </div>
  );
}
