'use client';

import { useState } from 'react';
import SidebarUser from '../../../components/navigation/SidebarUser/Sidebaruser';
import { PageLayout } from '../../../components/layout';
import { Button, Input, Label, FileUpload, FormActions } from '../../../components/forms';
import { Card, CardSection } from '../../../components/cards';

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
            <FileUpload
              accept="application/pdf, image/*"
              file={medicalFile}
              onChange={setMedicalFile}
              label="Drag Images/PDF or Click to Browse"
              helperText="Format PDF / Image (Max 5MB)"
            />
          </CardSection>
        </Card>

        <FormActions>
          <Button type="submit" disabled={!isFormValid}>Submit</Button>
        </FormActions>
      </form>
    </PageLayout>
  );
}
