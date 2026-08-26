'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { FileText, Upload } from 'lucide-react';
import PageTopBar from '@/app/components/layout/PageTopBar';
import SectionCard from '@/app/components/layout/SectionCard';
import Button from '@/app/components/forms/Button';
import TextField from '@/app/components/forms/TextField';
import UploadBox from '@/app/components/forms/UploadBox';
import Modal from '@/app/components/feedback/Modal';
import ConfirmModal from '@/app/components/feedback/ConfirmModal';
import StatusModal, { StatusState } from '@/app/components/feedback/StatusModal';
import PdfPreviewModal, { PdfPreviewTarget } from '@/app/components/feedback/PdfPreviewModal';
import { cn } from '@/app/utils/cn';
import { canUseEmployeeFeatures } from '@/lib/roles';
import { CareerHubSkeleton } from '@/app/components/feedback/PageSkeleton';

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
  const [assessments, setAssessments] = useState<Assessment[]>([]);

  const [cvFile, setCvFile] = useState<{ name: string; url: string } | null>(null);
  const [isCvModalOpen, setIsCvModalOpen] = useState(false);
  const [selectedCvFile, setSelectedCvFile] = useState<File | null>(null);

  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [editingCertId, setEditingCertId] = useState<string | null>(null);
  const [certTitleInput, setCertTitleInput] = useState('');
  const [selectedCertFile, setSelectedCertFile] = useState<File | null>(null);
  const [previewPdf, setPreviewPdf] = useState<PdfPreviewTarget | null>(null);
  const [certToDelete, setCertToDelete] = useState<string | null>(null);
  const [deletingCert, setDeletingCert] = useState(false);
  const [idRole, setIdRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<StatusState | null>(null);

  const uploadFile = async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const data = await res.json();
    if (!res.ok || !data.url) throw new Error(data.error || 'Upload gagal');
    return data.url;
  };

  const loadCertifications = async () => {
    try {
      const res = await fetch('/api/certificates', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setCertifications(
          (data.list ?? []).map((c: { idSertifikat: string; judul: string; fileURL?: string | null; fileName?: string | null }) => ({
            id: c.idSertifikat,
            title: c.judul,
            fileUrl: c.fileURL ?? '',
            fileName: c.fileName ?? 'document.pdf',
          }))
        );
      }
    } catch {}
  };

  const loadInitial = async () => {
    try {
      const meRes = await fetch('/api/me', { cache: 'no-store' });
      if (meRes.ok) {
        const me = await meRes.json();
        const url = me.user?.cvURL;
        if (url) setCvFile({ name: url.split('/').pop() ?? 'CV.pdf', url });
        if (me.user?.idRole) setIdRole(me.user.idRole);
      }
      const asmRes = await fetch('/api/assessments/open', { cache: 'no-store' });
      if (asmRes.ok) {
        const d = await asmRes.json();
        const open = d.assessment as { idAssessment: string; judul: string } | null;
        const taken = !!d.submission;
        if (open) {
          setAssessments([{ id: open.idAssessment, name: open.judul, done: taken }]);
        }
      }
      await loadCertifications();
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      await loadInitial();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCvModal = () => {
    setSelectedCvFile(null);
    setIsCvModalOpen(true);
  };

  const handleCvSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedCvFile) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', selectedCvFile);
      const res = await fetch('/api/me/cv', { method: 'PATCH', body: fd });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.fileURL) {
        setStatus({ ok: false, text: data?.error || 'Failed to save CV' });
        return;
      }
      setCvFile({ name: selectedCvFile.name, url: data.fileURL });
      setIsCvModalOpen(false);
    } catch (err: unknown) {
      setStatus({ ok: false, text: err instanceof Error ? err.message : 'Failed to upload CV' });
    } finally {
      setLoading(false);
    }
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

  const handleSaveCertification = async (e: FormEvent) => {
    e.preventDefault();
    if (!certTitleInput.trim()) {
      setStatus({ ok: false, text: 'Title must be filled!' });
      return;
    }
    try {
      const fileName = selectedCertFile ? selectedCertFile.name : 'document.pdf';
      let fileURL = '';
      if (selectedCertFile) fileURL = await uploadFile(selectedCertFile);

      if (editingCertId) {
        const res = await fetch(`/api/certificates/${editingCertId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ judul: certTitleInput, fileName, ...(fileURL && { fileURL }) }),
        });
        if (!res.ok) {
          setStatus({ ok: false, text: 'Failed to update certificate' });
          return;
        }
        setCertifications((prev) =>
          prev.map((item) => item.id === editingCertId ? { ...item, title: certTitleInput, fileName, ...(fileURL ? { fileUrl: fileURL } : {}) } : item)
        );
      } else {
        const res = await fetch('/api/certificates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ judul: certTitleInput, fileName, fileURL }),
        });
        const data = await res.json();
        if (!res.ok) {
          setStatus({ ok: false, text: 'Failed to add certificate' });
          return;
        }
        setCertifications((prev) => [
          ...prev,
          { id: data.certificate.idSertifikat, title: certTitleInput, fileUrl: fileURL, fileName },
        ]);
      }
    } catch (err) {
      setStatus({ ok: false, text: err instanceof Error ? err.message : 'A network error occurred' });
      return;
    }
    setIsCertModalOpen(false);
  };

  const handleDeleteCertification = async (id: string) => {
    setDeletingCert(true);
    const res = await fetch(`/api/certificates/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      setStatus({ ok: false, text: 'Failed to delete certificate' });
      setDeletingCert(false);
      return;
    }
    setCertifications((prev) => prev.filter((item) => item.id !== id));
    setIsCertModalOpen(false);
    setPreviewPdf(null);
    setDeletingCert(false);
    setCertToDelete(null);
  };

  const handleViewPdf = (title: string, url: string) => {
    if (!url) return;
    setPreviewPdf({ title, url });
  };

  if (loading) return <CareerHubSkeleton />;

  return (
    <>
      <div className="w-full h-full flex flex-col gap-3">
        <PageTopBar showGreeting />

        {canUseEmployeeFeatures(idRole) && (
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
                      onClick={() => router.push(a.done ? '/user/careerhub/result' : '/user/assessment')}
                    >
                      {a.done ? 'View Result' : 'Take Test'}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        )}

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
                Add Certificate
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
              onDelete={editingCertId ? () => setCertToDelete(editingCertId) : undefined}
              onClose={() => setIsCertModalOpen(false)}
            />
          )}
        </AnimatePresence>

        <PdfPreviewModal target={previewPdf} onClose={() => setPreviewPdf(null)} />

        <AnimatePresence>
          {certToDelete && (
            <ConfirmModal
              title="Delete Certificate"
              message={
                <>
                  Are you sure you want to delete{' '}
                  <span className="font-semibold">
                    {certifications.find((c) => c.id === certToDelete)?.title ?? 'this certificate'}
                  </span>
                  ? This action can&apos;t be undone.
                </>
              }
              confirmLabel="Delete"
              loadingLabel="Deleting..."
              loading={deletingCert}
              onConfirm={() => handleDeleteCertification(certToDelete)}
              onCancel={() => setCertToDelete(null)}
            />
          )}
        </AnimatePresence>

        <StatusModal state={status} onClose={() => setStatus(null)} />
      </div>
    </>
  );
}