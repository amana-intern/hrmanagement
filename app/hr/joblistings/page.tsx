'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { PageTopBar, SectionCard, QuickSearchBox, DataTable, Button, OutlineButton, TextField, StatusPill, Modal } from '../../components/ui';
import { springSoft, durationSlow, durationFast, easeOut } from '@/app/utils/motion';
import type { DataTableColumn } from '../../components/ui';

type JobStatus = 'Published' | 'Draft';

interface JobListing {
  id: number;
  title: string;
  description: string;
  qualifications: string;
  formLink: string;
  status: JobStatus;
}

const initialJobs: JobListing[] = [
  { id: 1, title: 'Senior Consultant - Education', description: 'Lead consulting projects in the education sector.', qualifications: 'Min 5 years experience in consulting', formLink: '', status: 'Published' },
  { id: 2, title: 'Junior Analyst - Digital', description: 'Assist in digital transformation projects.', qualifications: 'Fresh graduate or 1 year experience', formLink: '', status: 'Published' },
  { id: 3, title: 'Project Manager - Operations', description: 'Manage end-to-end operational projects.', qualifications: 'PMP certification preferred', formLink: '', status: 'Published' },
  { id: 4, title: 'Finance Officer', description: 'Handle financial reporting and analysis.', qualifications: 'Min 2 years in finance role', formLink: '', status: 'Draft' },
];

let nextId = 5;

const emptyForm = { title: '', description: '', formLink: '' };

const statusColor: Record<JobStatus, string> = {
  Published: 'bg-amana-success-500',
  Draft: 'bg-amana-neutral-400',
};

function ConfirmDeleteDialog({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div
        className="absolute inset-0 bg-amana-neutral-500/60"
        onClick={onCancel}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: durationSlow }}
      />
      <motion.div
        className="relative w-full max-w-md flex flex-col items-center text-center gap-3 bg-amana-neutral-100 rounded-[10px] border border-amana-primary-500 shadow-lg p-6"
        initial={{ opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1, transition: springSoft }}
        exit={{ opacity: 0, y: 12, scale: 0.97, transition: { duration: durationFast, ease: easeOut } }}
      >
        <div className="w-12 h-12 rounded-full bg-amana-danger-100 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-amana-danger-500" />
        </div>
        <h2 className="text-[20px] font-semibold text-amana-neutral-500">Delete this listing?</h2>
        <p className="text-[14px] text-amana-neutral-400">
          This action can&apos;t be undone. The listing will be permanently removed.
        </p>
        <div className="flex gap-3 w-full pt-2">
          <Button variant="danger" size="lg" className="flex-1" onClick={onConfirm}>
            Delete
          </Button>
          <OutlineButton className="flex-1" onClick={onCancel}>
            Cancel
          </OutlineButton>
        </div>
      </motion.div>
    </div>
  );
}

function JobFormModal({
  mode,
  status,
  initial,
  onClose,
  onSaveDraft,
  onPublish,
  onUpdate,
  onTakedown,
  onDelete,
}: {
  mode: 'add' | 'edit';
  status?: JobStatus;
  initial: { title: string; description: string; formLink: string };
  onClose: () => void;
  onSaveDraft?: (values: { title: string; description: string; formLink: string }) => void;
  onPublish?: (values: { title: string; description: string; formLink: string }) => void;
  onUpdate?: (values: { title: string; description: string; formLink: string }) => void;
  onTakedown?: () => void;
  onDelete?: () => void;
}) {
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [formLink, setFormLink] = useState(initial.formLink);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const values = { title, description, formLink };
  const invalid = !title || !description;
  const showDraftActions = mode === 'add' || status === 'Draft';

  return (
    <>
      <Modal title={mode === 'add' ? 'Add Job' : 'Edit Job'} onClose={onClose} className="max-h-[90vh]">
        <div className="flex-1 min-h-0 overflow-y-auto scroll-smooth p-5 flex flex-col gap-4">
          <TextField label="Job Title" value={title} onChange={setTitle} placeholder="e.g. Senior Consultant" />

          <div className="flex flex-col gap-1.5">
            <label className="text-[16px] font-semibold text-amana-neutral-500">Job Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the role, responsibilities, and key qualifications..."
              rows={5}
              className="w-full border border-amana-neutral-300 rounded-[13px] px-3 py-2.5 text-[16px] text-amana-neutral-500 placeholder:text-amana-neutral-300 transition-colors duration-200 focus:outline-none focus:border-amana-primary-500 resize-none"
            />
          </div>

          <TextField label="Google Form Link" value={formLink} onChange={setFormLink} placeholder="https://docs.google.com/forms/..." />
        </div>

        <div className="flex-shrink-0 flex items-center justify-between gap-3 px-5 py-4 border-t border-amana-neutral-200">
          <div>
            {mode === 'edit' && status === 'Draft' && onDelete && (
              <Button variant="danger" size="lg" onClick={() => setConfirmingDelete(true)}>
                Delete Listing
              </Button>
            )}
            {mode === 'edit' && status === 'Published' && onTakedown && (
              <Button variant="danger" size="lg" onClick={onTakedown}>
                Takedown Listing
              </Button>
            )}
          </div>

          <div className="flex gap-3">
            {showDraftActions && onSaveDraft && (
              <OutlineButton onClick={() => onSaveDraft(values)} disabled={invalid}>
                Save Draft
              </OutlineButton>
            )}
            {showDraftActions && onPublish && (
              <Button variant="primary" size="lg" onClick={() => onPublish(values)} disabled={invalid}>
                Publish
              </Button>
            )}
            {mode === 'edit' && status === 'Published' && onUpdate && (
              <Button variant="primary" size="lg" onClick={() => onUpdate(values)} disabled={invalid}>
                Update Listing
              </Button>
            )}
          </div>
        </div>
      </Modal>

      <AnimatePresence>
        {confirmingDelete && onDelete && (
          <ConfirmDeleteDialog
            onConfirm={() => {
              setConfirmingDelete(false);
              onDelete();
            }}
            onCancel={() => setConfirmingDelete(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default function JobListingsPage() {
  const [jobs, setJobs] = useState<JobListing[]>(initialJobs);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [editingJob, setEditingJob] = useState<JobListing | null>(null);

  const filtered = useMemo(() => {
    if (!appliedQuery) return jobs;
    return jobs.filter((j) => j.title.toLowerCase().includes(appliedQuery.toLowerCase()));
  }, [jobs, appliedQuery]);

  const openAdd = () => {
    setEditingJob(null);
    setModalMode('add');
  };

  const openEdit = (job: JobListing) => {
    setEditingJob(job);
    setModalMode('edit');
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingJob(null);
  };

  const handleSaveDraft = (values: { title: string; description: string; formLink: string }) => {
    if (modalMode === 'add') {
      setJobs((prev) => [...prev, { id: nextId++, ...values, qualifications: '', status: 'Draft' }]);
    } else if (editingJob) {
      setJobs((prev) => prev.map((j) => (j.id === editingJob.id ? { ...j, ...values, status: 'Draft' } : j)));
    }
    closeModal();
  };

  const handlePublish = (values: { title: string; description: string; formLink: string }) => {
    if (modalMode === 'add') {
      setJobs((prev) => [...prev, { id: nextId++, ...values, qualifications: '', status: 'Published' }]);
    } else if (editingJob) {
      setJobs((prev) => prev.map((j) => (j.id === editingJob.id ? { ...j, ...values, status: 'Published' } : j)));
    }
    closeModal();
  };

  const handleUpdate = (values: { title: string; description: string; formLink: string }) => {
    if (editingJob) {
      setJobs((prev) => prev.map((j) => (j.id === editingJob.id ? { ...j, ...values } : j)));
    }
    closeModal();
  };

  const handleTakedown = (job: JobListing) => {
    setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, status: 'Draft' } : j)));
    closeModal();
  };

  const handleDelete = (job: JobListing) => {
    setJobs((prev) => prev.filter((j) => j.id !== job.id));
    closeModal();
  };

  const columns: DataTableColumn<JobListing>[] = [
    { key: 'title', label: 'Name' },
    { key: 'description', label: 'Description' },
    { key: 'status', label: 'Status', width: '140px', render: (j) => <StatusPill color={statusColor[j.status]}>{j.status}</StatusPill> },
    {
      key: 'id',
      label: 'Actions',
      width: '140px',
      render: (j) => (
        <Button variant="primary" size="sm" className="w-full whitespace-nowrap" onClick={() => openEdit(j)}>
          Edit
        </Button>
      ),
    },
  ];

  return (
    <>
      <div className="w-full h-full flex flex-col gap-3">
        <PageTopBar showGreeting section="Career Hub" page="Job Listing" />

        <QuickSearchBox
          title="Filter Job Listing"
          subtitle="Filter Job Listing by title, employment type, status"
          query={query}
          onQueryChange={setQuery}
          onSearch={() => setAppliedQuery(query)}
          placeholder="Search by job title..."
          open={searchOpen}
          onToggle={() => setSearchOpen((v) => !v)}
        />

        <SectionCard
          title="Job Listing(s)"
          scroll
          action={
            <Button variant="primary" size="md" onClick={openAdd}>
              Add Listing
            </Button>
          }
        >
          <DataTable columns={columns} rows={filtered} defaultSortKey="title" emptyMessage="No job listings match your search." />
        </SectionCard>
      </div>

      <AnimatePresence>
        {modalMode && (
          <JobFormModal
            mode={modalMode}
            status={editingJob?.status}
            initial={
              modalMode === 'edit' && editingJob
                ? { title: editingJob.title, description: editingJob.description, formLink: editingJob.formLink }
                : emptyForm
            }
            onClose={closeModal}
            onSaveDraft={modalMode === 'add' || editingJob?.status === 'Draft' ? handleSaveDraft : undefined}
            onPublish={modalMode === 'add' || editingJob?.status === 'Draft' ? handlePublish : undefined}
            onUpdate={modalMode === 'edit' && editingJob?.status === 'Published' ? handleUpdate : undefined}
            onTakedown={editingJob && editingJob.status === 'Published' ? () => handleTakedown(editingJob) : undefined}
            onDelete={editingJob && editingJob.status === 'Draft' ? () => handleDelete(editingJob) : undefined}
          />
        )}
      </AnimatePresence>
    </>
  );
}
