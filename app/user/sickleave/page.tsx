'use client';

import { useState } from 'react';
import { PageTopBar, SectionCard, TextField, UploadBox, Button } from '../../components/ui';

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
      <div className="w-full h-full flex flex-col gap-3">
        <PageTopBar showGreeting section="Attendance" page="Sick Leave" />

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <SectionCard title="Sick Leave Schedule">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl">
              <TextField label="When are you leaving?" type="date" value={startDate} onChange={setStartDate} />
              <TextField label="When will you be back?" type="date" value={endDate} onChange={setEndDate} />
            </div>
          </SectionCard>

          <SectionCard title="Upload Medical Certificate">
            <UploadBox
              file={medicalFile}
              placeholder="Drag Images/PDF or Click to Browse"
              onFileSelect={setMedicalFile}
              accept="application/pdf, image/*"
            />
            <div className="flex justify-end pt-4 mt-4 border-t border-amana-neutral-200">
              <Button type="submit" variant="primary" size="lg" disabled={!isFormValid}>
                Submit
              </Button>
            </div>
          </SectionCard>
        </form>
      </div>
  );
}
