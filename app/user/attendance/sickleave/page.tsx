'use client';

import { useState } from 'react';
import SidebarUser from '../../../components/Sidebar/SidebarUser/Sidebaruser';
import { PageLayout, PageTitle, Card, CardSection, Button, Input, Label } from '../../../components/ui';

export default function SickLeavePage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [medicalFile, setMedicalFile] = useState<File | null>(null);

  const isFormValid = startDate !== '' && endDate !== '' && medicalFile !== null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    alert('Sick leave submitted successfully!');
  };

  return (
    <PageLayout sidebar={<SidebarUser />}>
      <PageTitle>Sick Leave</PageTitle>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Card padding="lg" className="animate-fade-in delay-100">
          <CardSection title="Sick Leave Schedule">
            <div className="flex flex-col gap-4 max-w-xl">
              <div>
                <Label>When are you leaving?</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <Label>When will you be back?</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
          </CardSection>
        </Card>

        <Card padding="lg" className="animate-slide-up delay-200">
          <CardSection title="Upload Medical Certificate">
            <div className="group relative flex h-44 w-full cursor-pointer flex-col items-center justify-center border-2 border-dashed border-amana-sec-6 rounded-2xl bg-amana-white hover:border-amana-blue/40 hover:bg-white transition-all duration-200">
              <input
                type="file"
                accept="application/pdf, image/*"
                onChange={(e) => setMedicalFile(e.target.files?.[0] || null)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <img src="/icon/BUpload.png" alt="" className="mb-2 h-10 w-10 object-contain" />
              <span className="text-sm font-semibold text-amana-blue">
                {medicalFile ? medicalFile.name : 'Drag Images/PDF or Click to Browse'}
              </span>
              <span className="text-xs text-amana-sec-7 mt-1 font-light">Format PDF / Image (Max 5MB)</span>
            </div>
          </CardSection>
        </Card>

        <div className="flex justify-end animate-fade-in delay-300">
          <Button type="submit" disabled={!isFormValid}>Submit</Button>
        </div>
      </form>
    </PageLayout>
  );
}
