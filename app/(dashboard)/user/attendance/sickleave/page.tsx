'use client';

import { useState } from 'react';
import PageTopBar from '@/app/components/layout/PageTopBar';
import SectionCard from '@/app/components/layout/SectionCard';
import TextField from '@/app/components/forms/TextField';
import UploadBox from '@/app/components/forms/UploadBox';
import Button from '@/app/components/forms/Button';
import StatusModal from '@/app/components/feedback/StatusModal';

export default function SickLeavePage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [symptom, setSymptom] = useState('');
  const [medicalFile, setMedicalFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const isFormValid = startDate !== '' && endDate !== '' && medicalFile !== null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setSubmitting(true);
    setMessage(null);

    const form = new FormData();
    form.append('tanggalMulai', startDate);
    form.append('tanggalSelesai', endDate);
    if (symptom) form.append('gejala', symptom);
    if (medicalFile) form.append('file', medicalFile);

    const res = await fetch('/api/sick', { method: 'POST', body: form });
    const data = await res.json();
    setSubmitting(false);

    if (res.ok) {
      setMessage({ ok: true, text: 'Sick leave submitted successfully!' });
      setStartDate('');
      setEndDate('');
      setSymptom('');
      setMedicalFile(null);
    } else {
      setMessage({ ok: false, text: data.error || 'Failed to submit request.' });
    }
  };

  return (
    <div className="w-full h-full flex flex-col gap-3">
      <PageTopBar showGreeting />

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <SectionCard title="Sick Leave Schedule">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl">
            <TextField label="When are you leaving?" type="date" value={startDate} onChange={setStartDate} />
            <TextField label="When will you be back?" type="date" value={endDate} onChange={setEndDate} />
          </div>
          <div className="mt-4 max-w-xl">
            <TextField
              label="Symptom / Diagnosis"
              value={symptom}
              onChange={setSymptom}
              placeholder="e.g. Fever, Migraine, Flu"
            />
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
            <Button type="submit" variant="primary" size="lg" disabled={!isFormValid || submitting}>
              {submitting ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </SectionCard>
      </form>

      <StatusModal state={message} onClose={() => setMessage(null)} />
    </div>
  );
}