'use client';

import { useState } from 'react';
import PageTopBar from '@/app/components/layout/PageTopBar';
import SectionCard from '@/app/components/layout/SectionCard';
import TextField from '@/app/components/forms/TextField';
import { SearchDateRangeCalendarField } from '@/app/components/forms/SearchFields';
import UploadBox from '@/app/components/forms/UploadBox';
import Button from '@/app/components/forms/Button';
import StatusModal from '@/app/components/feedback/StatusModal';
import UploadProgressModal from '@/app/components/feedback/UploadProgressModal';
import { uploadWithProgress } from '@/app/utils/uploadWithProgress';
import { todayISOWIB } from '@/lib/constants';

export default function SickLeavePage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [symptom, setSymptom] = useState('');
  const [medicalFile, setMedicalFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadPct, setUploadPct] = useState<number | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const isFormValid = startDate !== '' && endDate !== '' && medicalFile !== null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setSubmitting(true);
    setMessage(null);
    setUploadPct(0);

    const form = new FormData();
    form.append('tanggalMulai', startDate);
    form.append('tanggalSelesai', endDate);
    if (symptom) form.append('gejala', symptom);
    if (medicalFile) form.append('file', medicalFile);

    try {
      const res = await uploadWithProgress('/api/sick', form, setUploadPct);
      const data = await res.json();
      await new Promise((r) => setTimeout(r, 350)); // let the "Upload Complete" state be visible briefly

      if (res.ok) {
        setMessage({ ok: true, text: 'Sick leave submitted successfully!' });
        setStartDate('');
        setEndDate('');
        setSymptom('');
        setMedicalFile(null);
      } else {
        setMessage({ ok: false, text: data.error || 'Failed to submit request.' });
      }
    } finally {
      setSubmitting(false);
      setUploadPct(null);
    }
  };

  return (
    <div className="w-full h-full flex flex-col gap-3">
      <PageTopBar showGreeting />

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <SectionCard title="Sick Leave Schedule">
          <SearchDateRangeCalendarField
            label="Sick Leave Period"
            minDate={todayISOWIB()}
            fromValue={startDate}
            toValue={endDate}
            onFromChange={setStartDate}
            onToChange={setEndDate}
          />
          <div className="mt-4">
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
            accept=".pdf,.jpg,.jpeg,.png"
          />
          <div className="flex justify-end pt-4 mt-4 border-t border-amana-neutral-200">
            <Button type="submit" variant="primary" size="lg" disabled={!isFormValid} isLoading={submitting}>
              {submitting ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </SectionCard>
      </form>

      <StatusModal state={message} onClose={() => setMessage(null)} />
      <UploadProgressModal open={uploadPct !== null} percent={uploadPct ?? 0} />
    </div>
  );
}