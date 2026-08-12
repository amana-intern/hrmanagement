'use client';

import { useState } from 'react';
import PageTopBar from '../../../components/layout/PageTopBar';
import SectionCard from '../../../components/layout/SectionCard';
import TextField from '../../../components/forms/TextField';
import UploadBox from '../../../components/forms/UploadBox';
import Button from '../../../components/forms/Button';

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
      setMessage({ ok: false, text: data.error || 'Gagal mengirim pengajuan.' });
    }
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
          {message && (
            <div className={`mt-4 px-4 py-2.5 rounded-lg border text-[13px] font-medium ${message.ok ? 'bg-amana-success-100 border-amana-success-300 text-amana-success-500' : 'bg-amana-danger-100 border-amana-danger-300 text-amana-danger-500'}`}>
              {message.text}
            </div>
          )}
          <div className="flex justify-end pt-4 mt-4 border-t border-amana-neutral-200">
            <Button type="submit" variant="primary" size="lg" disabled={!isFormValid || submitting}>
              {submitting ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </SectionCard>
      </form>
    </div>
  );
}