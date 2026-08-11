'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { FileText, Upload } from 'lucide-react';
import { PageTopBar, SectionCard, Button, TextField, UploadBox, Modal } from '../../components/ui';
import { cn } from '@/app/utils/cn';

interface Certification {
  id: string;
  title: string;
  fileUrl: string;
  fileName: string;
}

interface Assessment {
  id: string;
  name: string;
  done: boolean;
}

/** Shared shape for the CV and Certificate upload modals — same layout, just a
 * different (optional) name field, submit label, and whether Delete is offered. */
function DocumentUploadModal({
  title,
  subtitle,
  fieldLabel,
  fieldValue,
  onFieldChange,
  file,
  filePlaceholder,
  onFileSelect,
  submitLabel,
  submitDisabled = false,
  onSubmit,
  onDelete,
  onClose,
}: {
  title: string;
  subtitle: string;
  fieldLabel?: string;
  fieldValue?: string;
  onFieldChange?: (value: string) => void;
  file: File | null;
  filePlaceholder: string;
  onFileSelect: (file: File | null) => void;
  submitLabel: string;
  submitDisabled?: boolean;
  onSubmit: (e: FormEvent) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  return (
    <Modal title={title} onClose={onClose} maxWidth="max-w-xl" className="max-h-[90vh]">
      <form onSubmit={onSubmit} className="flex-1 min-h-0 flex flex-col">
        <div className="flex-1 min-h-0 overflow-y-auto scroll-smooth p-5 flex flex-col gap-4">
          <p className="text-[14px] text-amana-neutral-400 -mt-2">{subtitle}</p>
          {fieldLabel && onFieldChange && (
            <TextField label={fieldLabel} required value={fieldValue ?? ''} onChange={onFieldChange} placeholder={fieldLabel} />
          )}
          <UploadBox file={file} placeholder={filePlaceholder} onFileSelect={onFileSelect} />
        </div>
        <div className={cn('flex-shrink-0 flex px-5 py-4 border-t border-amana-neutral-200', onDelete ? 'items-center gap-3' : 'justify-end')}>
          {onDelete && (
            <Button type="button" variant="danger" size="lg" className="flex-1" onClick={onDelete}>
              Delete
            </Button>
          )}
          <Button type="submit" variant="primary" size="lg" disabled={submitDisabled} className={onDelete ? 'flex-1' : 'w-full max-w-[280px]'}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function CareerHubPage() {
  const router = useRouter();
  const [assessments, setAssessments] = useState<Assessment[]>([
    { id: 'competency', name: 'Competency Assessment', done: true },
    { id: 'weekly', name: 'Weekly Assessment', done: false },
  ]);
  const [assessmentModal, setAssessmentModal] = useState<{ mode: 'take' | 'view'; assessment: Assessment } | null>(null);

  const [cvFile, setCvFile] = useState<{ name: string; url: string } | null>(null);
  const [isCvModalOpen, setIsCvModalOpen] = useState(false);
  const [selectedCvFile, setSelectedCvFile] = useState<File | null>(null);

  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [editingCertId, setEditingCertId] = useState<string | null>(null);
  const [certTitleInput, setCertTitleInput] = useState('');
  const [selectedCertFile, setSelectedCertFile] = useState<File | null>(null);
  const [previewPdf, setPreviewPdf] = useState<{ title: string; url: string } | null>(null);

  const handleCompleteAssessment = () => {
    if (!assessmentModal) return;
    const id = assessmentModal.assessment.id;
    setAssessments((prev) => prev.map((a) => (a.id === id ? { ...a, done: true } : a)));
    setAssessmentModal(null);
  };

  const openCvModal = () => {
    setSelectedCvFile(null);
    setIsCvModalOpen(true);
  };

  const handleCvSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedCvFile) return;
    setCvFile({ name: selectedCvFile.name, url: URL.createObjectURL(selectedCvFile) });
    setIsCvModalOpen(false);
  };

  const openAddCertModal = () => {
    setEditingCertId(null);
    setCertTitleInput('');
    setSelectedCertFile(null);
    setIsCertModalOpen(true);
  };

  const openUpdateCertModal = (cert: Certification) => {
    setEditingCertId(cert.id);
    setCertTitleInput(cert.title);
    setSelectedCertFile(null);
    setIsCertModalOpen(true);
  };

  const handleSaveCertification = (e: FormEvent) => {
    e.preventDefault();
    if (!certTitleInput.trim()) {
      alert('Title must be filled!');
      return;
    }
    const fileUrl = selectedCertFile ? URL.createObjectURL(selectedCertFile) : '';
    const fileName = selectedCertFile ? selectedCertFile.name : 'document.pdf';
    if (editingCertId) {
      setCertifications((prev) =>
        prev.map((item) =>
          item.id === editingCertId ? { ...item, title: certTitleInput, ...(selectedCertFile && { fileUrl, fileName }) } : item
        )
      );
    } else {
      setCertifications((prev) => [...prev, { id: Date.now().toString(), title: certTitleInput, fileUrl, fileName }]);
    }
    setIsCertModalOpen(false);
  };

  const handleDeleteCertification = (id: string) => {
    if (window.confirm('Are you sure you want to delete this certification?')) {
      setCertifications((prev) => prev.filter((item) => item.id !== id));
      setIsCertModalOpen(false);
    }
  };

  const handleViewPdf = (title: string, url: string) => {
    if (!url) {
      alert(`Opening PDF Simulation: ${title}`);
      return;
    }
    setPreviewPdf({ title, url });
  };

  return (
    <>
      <div className="w-full h-full flex flex-col gap-3">
        <PageTopBar showGreeting section="Career Hub" page="Career Hub" />

        <SectionCard title="Assessment Test">
          {assessments.length === 0 ? (
            <p className="text-[16px] text-amana-neutral-400 text-center py-1.5">
              There are currently no assessment test that needs to be done.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {assessments.map((a) => (
                <div key={a.id} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <span className="flex-1 text-[16px] text-amana-neutral-500 truncate">{a.name}</span>
                  <div
                    className={`flex-1 flex items-center justify-center rounded-full px-5 py-1.5 text-center text-[14px] font-medium text-amana-neutral-100 ${
                      a.done ? 'bg-amana-success-500' : 'bg-amana-danger-500'
                    }`}
                  >
                    {a.done ? 'Done' : 'Not Done'}
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    className="sm:w-[139px] flex-shrink-0"
                    onClick={() => {
                      if (a.done && a.id === 'competency') {
                        router.push('/user/careerhub/result');
                        return;
                      }
                      setAssessmentModal({ mode: a.done ? 'view' : 'take', assessment: a });
                    }}
                  >
                    {a.done ? 'View Result' : 'Take Test'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <SectionCard title="Latest Curriculum Vitae (CV)" subtitle="Update your latest CV in this tab!" scroll>
            {cvFile ? (
              <div className="border border-amana-primary-500 rounded-[5px] overflow-hidden h-56 mb-4">
                <iframe src={cvFile.url} className="w-full h-full" title={cvFile.name} />
              </div>
            ) : (
              <div
                onClick={openCvModal}
                className="group border border-amana-primary-500 rounded-[5px] flex flex-col items-center justify-center h-56 gap-2.5 bg-amana-neutral-100 hover:bg-amana-primary-100 transition-colors duration-200 mb-4 cursor-pointer"
              >
                <Upload className="w-11 h-11 text-amana-primary-500" strokeWidth={1.5} />
                <p className="text-[16px] text-center text-amana-neutral-400 group-hover:text-amana-primary-500 transition-colors duration-200">
                  Click &ldquo;Add&rdquo; to upload your CV!
                </p>
              </div>
            )}
            <div className="flex justify-end mt-auto">
              <Button variant="primary" size="md" onClick={openCvModal}>
                {cvFile ? 'Update CV' : 'Add CV'}
              </Button>
            </div>
          </SectionCard>

          <SectionCard title="Latest Certification" subtitle="Update your latest skills certification in this tab!" scroll>
            <div className="flex-1 min-h-0 flex flex-col gap-2.5 overflow-y-auto scroll-smooth pr-1 mb-3">
              {certifications.length === 0 ? (
                <p className="flex-1 flex items-center justify-center text-[16px] text-amana-neutral-400 text-center">
                  You have no certificate uploaded, click &ldquo;Add&rdquo; to upload your recent certificate!
                </p>
              ) : (
                certifications.map((cert) => (
                  <div
                    key={cert.id}
                    className="flex items-center justify-between p-3 border border-amana-neutral-300 rounded-[13px] bg-amana-neutral-100"
                  >
                    <div className="flex items-center gap-3 overflow-hidden mr-2">
                      <FileText className="w-5 h-5 flex-shrink-0 text-amana-primary-500" />
                      <span className="font-semibold text-sm truncate text-amana-neutral-500">{cert.title}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button variant="primary" size="sm" onClick={() => handleViewPdf(cert.title, cert.fileUrl)}>
                        View
                      </Button>
                      <Button variant="primary" size="sm" onClick={() => openUpdateCertModal(cert)}>
                        Update
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="border-t border-amana-neutral-200 pt-3 flex justify-end">
              <Button variant="primary" size="md" onClick={openAddCertModal}>
                + Add Certificate
              </Button>
            </div>
          </SectionCard>
        </div>

        <AnimatePresence>
        {isCvModalOpen && (
          <DocumentUploadModal
            title={cvFile ? 'Update Curriculum Vitae (CV)' : 'Add Curriculum Vitae (CV)'}
            subtitle="Search or Drag and Drop your Latest CV"
            file={selectedCvFile}
            filePlaceholder="Curriculum Vitae Document (.PDF)"
            onFileSelect={setSelectedCvFile}
            submitLabel={cvFile ? 'Update' : 'Add CV'}
            submitDisabled={!selectedCvFile}
            onSubmit={handleCvSubmit}
            onClose={() => setIsCvModalOpen(false)}
          />
        )}
        </AnimatePresence>

        <AnimatePresence>
        {isCertModalOpen && (
          <DocumentUploadModal
            title={editingCertId ? 'View Certificate' : 'Add Certificate'}
            subtitle={editingCertId ? 'View, Update, or Delete your Certification' : 'Search or Drag and Drop your Certificate Document'}
            fieldLabel="Certificate Name"
            fieldValue={certTitleInput}
            onFieldChange={setCertTitleInput}
            file={selectedCertFile}
            filePlaceholder="Certificate Document (.PDF)"
            onFileSelect={setSelectedCertFile}
            submitLabel={editingCertId ? 'Update' : 'Add Certificate'}
            onSubmit={handleSaveCertification}
            onDelete={editingCertId ? () => handleDeleteCertification(editingCertId) : undefined}
            onClose={() => setIsCertModalOpen(false)}
          />
        )}
        </AnimatePresence>

        <AnimatePresence>
        {assessmentModal && (
          <Modal title={assessmentModal.assessment.name} onClose={() => setAssessmentModal(null)} maxWidth="max-w-md">
            <div className="p-5">
              <p className="text-[15px] text-amana-neutral-400">
                {assessmentModal.mode === 'take' ? 'Simulation Assessment Test' : 'Simulation Assessment Result'}
              </p>
            </div>
            {assessmentModal.mode === 'take' && (
              <div className="flex-shrink-0 flex justify-end px-5 py-4 border-t border-amana-neutral-200">
                <Button variant="primary" size="lg" onClick={handleCompleteAssessment}>
                  Finish Test
                </Button>
              </div>
            )}
          </Modal>
        )}
        </AnimatePresence>

        <AnimatePresence>
        {previewPdf && (
          <Modal title={previewPdf.title} onClose={() => setPreviewPdf(null)} maxWidth="max-w-3xl" className="h-[80vh]">
            <div className="flex-1 p-4">
              {previewPdf.url ? (
                <iframe src={previewPdf.url} className="w-full h-full rounded-[13px] border border-amana-neutral-300" title="PDF" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-amana-neutral-400">
                  <FileText className="w-16 h-16 mb-3 opacity-50" strokeWidth={1.25} />
                  <p className="font-semibold text-sm">PDF Preview Simulation</p>
                </div>
              )}
            </div>
          </Modal>
        )}
        </AnimatePresence>
      </div>
    </>
  );
}
