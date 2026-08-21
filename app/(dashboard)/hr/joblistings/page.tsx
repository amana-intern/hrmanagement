'use client';

import { useEffect, useMemo, useState } from 'react';
import PageTopBar from '@/app/components/layout/PageTopBar';
import QuickSearchBox from '@/app/components/data-display/QuickSearchBox';
import SectionCard from '@/app/components/layout/SectionCard';
import DataTable from '@/app/components/data-display/DataTable';
import type { DataTableColumn } from '@/app/components/data-display/DataTable';
import Button from '@/app/components/forms/Button';
import Modal from '@/app/components/feedback/Modal';
import StatusPill from '@/app/components/data-display/StatusPill';
import TextField from '@/app/components/forms/TextField';
import StatusModal from '@/app/components/feedback/StatusModal';
import { TableSkeleton } from '@/app/components/feedback/PageSkeleton';

interface Job {
  id: string;
  title: string;
  status: 'DRAFT' | 'OPEN' | 'CLOSED';
  description: string;
  formLink: string;
}

interface RawJob {
  idLowongan: string;
  namaPosisi?: string | null;
  idStatus?: string | null;
  deskripsi?: string | null;
  googleFormURL?: string | null;
}

const STATUS_LABELS: Record<Job['status'], { label: string; color: string }> = {
  DRAFT: { label: 'Draft', color: 'bg-amana-neutral-400' },
  OPEN: { label: 'Active', color: 'bg-amana-success-500' },
  CLOSED: { label: 'Closed', color: 'bg-amana-neutral-400' },
};

export default function JobListingsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [showTakedownModal, setShowTakedownModal] = useState<Job | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<Job | null>(null);
  const [editJob, setEditJob] = useState<Job | null>(null);

  const [newJob, setNewJob] = useState({ title: '', description: '', formLink: '' });
  const [editFields, setEditFields] = useState({ title: '', description: '', formLink: '' });
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const res = await fetch('/api/joblistings?all=1', { cache: 'no-store' });
    if (res.ok) {
      const data = (await res.json()) as { list?: RawJob[] };
      setJobs(
        (data.list ?? []).map((l) => ({
          id: l.idLowongan,
          title: l.namaPosisi ?? '-',
          status: l.idStatus === 'DRAFT' ? 'DRAFT' : l.idStatus === 'CLOSED' ? 'CLOSED' : 'OPEN',
          description: l.deskripsi ?? '',
          formLink: l.googleFormURL ?? '',
        }))
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!appliedQuery) return jobs;
    return jobs.filter((j) => j.title.toLowerCase().includes(appliedQuery.toLowerCase()));
  }, [jobs, appliedQuery]);

  const patchJob = async (id: string, body: Record<string, string | null>) => {
    const res = await fetch(`/api/joblistings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error('Gagal memperbarui lowongan');
  };

  const handleAddJob = async (asDraft: boolean) => {
    if (!newJob.title || !newJob.description) return;
    setBusy(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/joblistings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          namaPosisi: newJob.title,
          deskripsi: newJob.description,
          googleFormURL: newJob.formLink || null,
          idStatus: asDraft ? 'DRAFT' : 'OPEN',
        }),
      });
      if (!res.ok) {
        setErrorMsg('Gagal menambahkan lowongan');
        return;
      }
      await load();
      setNewJob({ title: '', description: '', formLink: '' });
      setShowAddModal(false);
      setStatus({ ok: true, text: asDraft ? `Job listing "${newJob.title}" saved as draft` : `Job listing "${newJob.title}" successfully published` });
    } finally {
      setBusy(false);
    }
  };

  const handleSaveEdit = async (asDraft: boolean) => {
    if (!editJob) return;
    setBusy(true);
    setErrorMsg('');
    try {
      const nextStatus = asDraft ? 'DRAFT' : 'OPEN';
      await patchJob(editJob.id, {
        namaPosisi: editFields.title,
        deskripsi: editFields.description,
        googleFormURL: editFields.formLink || null,
        idStatus: nextStatus,
      });
      await load();
      setEditJob(null);
      setStatus({ ok: true, text: asDraft ? `Job listing "${editFields.title}" saved as draft` : `Job listing "${editFields.title}" successfully published` });
    } catch {
      setErrorMsg('Gagal memperbarui lowongan');
    } finally {
      setBusy(false);
    }
  };

  const handleTakedown = async (job: Job) => {
    const res = await fetch(`/api/joblistings/${job.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idStatus: 'CLOSED' }),
    });
    if (!res.ok) {
      setStatus({ ok: false, text: 'Failed to close job listing' });
      return;
    }
    setShowTakedownModal(null);
    setEditJob(null);
    await load();
    setStatus({ ok: true, text: `Job listing "${job.title}" successfully closed` });
  };

  const handleDelete = async (job: Job) => {
    const res = await fetch(`/api/joblistings/${job.id}`, { method: 'DELETE' });
    if (!res.ok) {
      setStatus({ ok: false, text: 'Failed to delete job listing' });
      return;
    }
    setShowDeleteModal(null);
    setEditJob(null);
    await load();
    setStatus({ ok: true, text: `Job listing "${job.title}" successfully deleted` });
  };

  const openEdit = (job: Job) => {
    setEditFields({ title: job.title, description: job.description, formLink: job.formLink });
    setErrorMsg('');
    setEditJob(job);
  };

  const editIsDraft = editJob?.status === 'DRAFT';

  const columns: DataTableColumn<Job>[] = [
    { key: 'title', label: 'Name' },
    { key: 'description', label: 'Description' },
    {
      key: 'status',
      label: 'Status',
      width: '140px',
      render: (j) => {
        const s = STATUS_LABELS[j.status];
        return <StatusPill color={s.color}>{s.label}</StatusPill>;
      },
    },
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

  if (loading) return <TableSkeleton columns={7} />;

  return (
    <>
      <div className="w-full h-full flex flex-col gap-3">
        <PageTopBar showGreeting />

        <QuickSearchBox
          title="Filter Job Listing"
          subtitle="Filter job listings by title"
          query={query}
          onQueryChange={setQuery}
          onSearch={() => setAppliedQuery(query)}
          placeholder="Search by job title..."
          open={searchOpen}
          onToggle={() => setSearchOpen((v) => !v)}
        />

        <SectionCard
          title="Job Listing(s)"
          subtitle={`${filtered.length} listing(s)`}
          scroll
          action={
            <Button variant="primary" size="md" onClick={() => { setNewJob({ title: '', description: '', formLink: '' }); setErrorMsg(''); setShowAddModal(true); }}>
              Add Listing
            </Button>
          }
        >
          {errorMsg && (
            <p className="pb-2 text-[13px] font-medium text-amana-danger-500">{errorMsg}</p>
          )}
          <DataTable columns={columns} rows={filtered} defaultSortKey="title" emptyMessage="Belum ada lowongan." />
        </SectionCard>
      </div>

      {showAddModal && (
        <Modal title="Add New Job" onClose={() => setShowAddModal(false)} maxWidth="max-w-2xl" className="max-h-[90vh]">
          <div className="flex-1 min-h-0 overflow-y-auto scroll-smooth p-5 flex flex-col gap-4">
            <TextField label="Job Title" value={newJob.title} onChange={(v) => setNewJob((p) => ({ ...p, title: v }))} placeholder="e.g. Senior Consultant" />
            <div className="flex flex-col gap-1.5">
              <label className="text-[16px] font-semibold text-amana-neutral-500">Job Description</label>
              <textarea
                value={newJob.description}
                onChange={(e) => setNewJob((p) => ({ ...p, description: e.target.value }))}
                placeholder="Describe the role and responsibilities..."
                rows={4}
                className="w-full border border-amana-neutral-300 rounded-[13px] px-3 py-2.5 text-[16px] text-amana-neutral-500 placeholder:text-amana-neutral-300 transition-colors duration-200 focus:outline-none focus:border-amana-primary-500 resize-none"
              />
            </div>
            <TextField label="Google Form Link" value={newJob.formLink} onChange={(v) => setNewJob((p) => ({ ...p, formLink: v }))} placeholder="https://docs.google.com/forms/..." />
          </div>

          {errorMsg && (
            <p className="px-5 pb-1 text-[13px] font-medium text-amana-danger-500">{errorMsg}</p>
          )}

          <div className="flex-shrink-0 flex justify-end gap-3 px-5 py-4 border-t border-amana-neutral-200">
            <Button variant="outline" size="lg" disabled={!newJob.title || !newJob.description || busy} onClick={() => handleAddJob(true)}>
              Save Draft
            </Button>
            <Button variant="primary" size="lg" disabled={!newJob.title || !newJob.description || busy} onClick={() => handleAddJob(false)}>
              {busy ? 'Publishing...' : 'Publish Job'}
            </Button>
          </div>
        </Modal>
      )}

      {editJob && (
        <Modal title={`Edit Job - ${editJob.title}`} onClose={() => setEditJob(null)} maxWidth="max-w-2xl" className="max-h-[90vh]">
          <div className="flex-1 min-h-0 overflow-y-auto scroll-smooth p-5 flex flex-col gap-4">
            <TextField label="Job Title" value={editFields.title} onChange={(v) => setEditFields((p) => ({ ...p, title: v }))} placeholder="e.g. Senior Consultant" />
            <div className="flex flex-col gap-1.5">
              <label className="text-[16px] font-semibold text-amana-neutral-500">Job Description</label>
              <textarea
                value={editFields.description}
                onChange={(e) => setEditFields((p) => ({ ...p, description: e.target.value }))}
                placeholder="Describe the role and responsibilities..."
                rows={4}
                className="w-full border border-amana-neutral-300 rounded-[13px] px-3 py-2.5 text-[16px] text-amana-neutral-500 placeholder:text-amana-neutral-300 transition-colors duration-200 focus:outline-none focus:border-amana-primary-500 resize-none"
              />
            </div>
            <TextField label="Google Form Link" value={editFields.formLink} onChange={(v) => setEditFields((p) => ({ ...p, formLink: v }))} placeholder="https://docs.google.com/forms/..." />
          </div>

          {errorMsg && (
            <p className="px-5 pb-1 text-[13px] font-medium text-amana-danger-500">{errorMsg}</p>
          )}

          <div className="flex-shrink-0 flex items-center justify-between gap-3 px-5 py-4 border-t border-amana-neutral-200">
            {editIsDraft ? (
              <Button variant="danger" size="lg" disabled={busy} onClick={() => setShowDeleteModal(editJob)}>
                Delete Listing
              </Button>
            ) : (
              <Button variant="danger" size="lg" disabled={busy} onClick={() => setShowTakedownModal(editJob)}>
                Takedown Listing
              </Button>
            )}
            <div className="flex gap-3">
              {editIsDraft ? (
                <>
                  <Button variant="outline" size="lg" disabled={!editFields.title || !editFields.description || busy} onClick={() => handleSaveEdit(true)}>
                    Save Draft
                  </Button>
                  <Button variant="primary" size="lg" disabled={!editFields.title || !editFields.description || busy} onClick={() => handleSaveEdit(false)}>
                    {busy ? 'Publishing...' : 'Publish'}
                  </Button>
                </>
              ) : (
                <Button variant="primary" size="lg" disabled={!editFields.title || !editFields.description || busy} onClick={() => handleSaveEdit(false)}>
                  {busy ? 'Updating...' : 'Update Listing'}
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {showTakedownModal && (
        <Modal title="Takedown Job Listing" onClose={() => setShowTakedownModal(null)} maxWidth="max-w-md">
          <div className="p-5 flex flex-col gap-4">
            <p className="text-sm text-amana-neutral-400">
              Are you sure you want to takedown <strong className="text-amana-neutral-500">{showTakedownModal.title}</strong>?
              This will close the listing and remove it from active job boards.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="danger" size="lg" onClick={() => handleTakedown(showTakedownModal)}>
                Yes, Takedown
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {showDeleteModal && (
        <Modal title="Delete Job Listing" onClose={() => setShowDeleteModal(null)} maxWidth="max-w-md">
          <div className="p-5 flex flex-col gap-4">
            <p className="text-sm text-amana-neutral-400">
              Are you sure you want to delete <strong className="text-amana-neutral-500">{showDeleteModal.title}</strong>?
              This will permanently remove the listing.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="danger" size="lg" onClick={() => handleDelete(showDeleteModal)}>
                Delete
              </Button>
            </div>
          </div>
        </Modal>
      )}

      <StatusModal state={status} onClose={() => setStatus(null)} />
    </>
  );
}