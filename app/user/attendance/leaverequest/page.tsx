'use client';

import { useState } from 'react';
import SidebarUser from '../../../components/navigation/SidebarUser/Sidebaruser';
import { PageLayout } from '../../../components/layout';
import { Button, Select, Label, FormActions, RadioList } from '../../../components/forms';
import { Card, CardSection, LeaveBalanceCard } from '../../../components/cards';

const leaveBalanceItems = [
  { count: '12', label: 'Paid Leave' },
  { count: '0', label: 'Special Leave' },
  { count: '0', label: 'Unpaid Leave' },
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

export default function LeaveRequestPage() {
  const [selectedLeave, setSelectedLeave] = useState('');
  const [selectedSpecialLeave, setSelectedSpecialLeave] = useState('');

  const isFormValid = selectedLeave !== '' && (selectedLeave !== 'Special Leave' || selectedSpecialLeave !== '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    alert('Leave request submitted successfully!');
  };

  return (
    <PageLayout sidebar={<SidebarUser />}>
      <Card padding="lg" className="mb-6 animate-fade-in delay-100">
        <CardSection title="Leave Balance">
          <div className="grid grid-cols-3 gap-4">
            {leaveBalanceItems.map((item, idx) => (
              <LeaveBalanceCard key={idx} count={item.count} label={item.label} />
            ))}
          </div>
        </CardSection>
      </Card>

      <form onSubmit={handleSubmit}>
        <Card padding="lg" className="animate-slide-up delay-200">
          <CardSection title="Request Leave">
            <div className="mb-5">
              <Label>Leave Option</Label>
              <Select
                value={selectedLeave}
                onChange={(e) => {
                  setSelectedLeave(e.target.value);
                  if (e.target.value !== 'Special Leave') setSelectedSpecialLeave('');
                }}
              >
                <option value="" disabled>Click here to select your leave option...</option>
                <option value="Paid Leave">Paid Leave</option>
                <option value="Special Leave">Special Leave</option>
                <option value="Unpaid Leave">Unpaid Leave</option>
              </Select>
            </div>

            <div className={`grid transition-all duration-300 ease-in-out ${selectedLeave === 'Special Leave' ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 overflow-hidden'}`}>
              <div className="overflow-hidden">
                <div className="border border-amana-sec-6 bg-amana-white p-5 rounded-xl">
                  <h3 className="font-semibold text-amana-blue text-sm mb-3">Special Leave List (Choose one)</h3>
                  <RadioList
                    options={specialLeaveList}
                    selected={selectedSpecialLeave}
                    onChange={setSelectedSpecialLeave}
                    name="specialLeaveType"
                    className="max-h-[260px] overflow-y-auto pr-2 custom-scrollbar"
                  />
                </div>
              </div>
            </div>

            <FormActions>
              <Button type="submit" disabled={!isFormValid}>Submit</Button>
            </FormActions>
          </CardSection>
        </Card>
      </form>
    </PageLayout>
  );
}
