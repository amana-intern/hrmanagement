'use client';

import { useState } from 'react';
import SidebarHR from '../../components/Sidebar/SidebarHR/Sidebarhr';
import { PageLayout, PageTitle, Card, Badge, Button, Input, Label, Modal } from '../../components/ui';

interface Job {
  id: number;
  title: string;
  status: 'Active' | 'Closed';
  description: string;
  qualifications: string;
  formLink: string;
}

let nextId = 5;

export default function JobListingsPage() {
  const [jobs, setJobs] = useState<Job[]>([
    { id: 1, title: 'Senior Consultant - Education', status: 'Active', description: 'Lead consulting projects in the education sector.', qualifications: 'Min 5 years experience in consulting', formLink: '' },
    { id: 2, title: 'Junior Analyst - Digital', status: 'Active', description: 'Assist in digital transformation projects.', qualifications: 'Fresh graduate or 1 year experience', formLink: '' },
    { id: 3, title: 'Project Manager - Operations', status: 'Active', description: 'Manage end-to-end operational projects.', qualifications: 'PMP certification preferred', formLink: '' },
    { id: 4, title: 'Finance Officer', status: 'Closed', description: 'Handle financial reporting and analysis.', qualifications: 'Min 2 years in finance role', formLink: '' },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showTakedownModal, setShowTakedownModal] = useState<Job | null>(null);

  const [newJob, setNewJob] = useState({ title: '', description: '', qualifications: '', formLink: '' });

  const handleAddJob = () => {
    if (!newJob.title || !newJob.description || !newJob.qualifications || !newJob.formLink) return;
    setJobs([...jobs, { id: nextId++, ...newJob, status: 'Active' }]);
    setNewJob({ title: '', description: '', qualifications: '', formLink: '' });
    setShowAddModal(false);
  };

  const handleTakedown = (job: Job) => {
    setJobs(jobs.map((j) => j.id === job.id ? { ...j, status: 'Closed' } : j));
    setShowTakedownModal(null);
  };

  return (
    <PageLayout sidebar={<SidebarHR />}>
      <div className="flex items-center justify-between">
        <Button variant="primary" onClick={() => setShowAddModal(true)}>+ Add Job</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {jobs.map((job, i) => (
          <div key={job.id} style={{ animationDelay: `${(i + 1) * 100}ms` }} className="animate-fade-in">
            <Card padding="lg">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-amana-black text-base">{job.title}</h3>
                <Badge variant={job.status === 'Active' ? 'success' : 'default'}>{job.status}</Badge>
              </div>
              <div className="space-y-1 mb-4">
                <p className="text-xs text-amana-sec-7">{job.description}</p>
              </div>
              {job.status === 'Active' ? (
                <Button
                  variant="danger"
                  className="w-full"
                  onClick={() => setShowTakedownModal(job)}
                >
                  Takedown Job Listing
                </Button>
              ) : (
                <div className="w-full text-center py-2.5 bg-amana-sec-6 text-amana-sec-7 rounded-xl font-semibold text-xs cursor-not-allowed">
                  Closed
                </div>
              )}
            </Card>
          </div>
        ))}
      </div>

      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Job">
        <div className="space-y-4">
          <div>
            <Label>Job Title</Label>
            <Input value={newJob.title} onChange={(e) => setNewJob({ ...newJob, title: e.target.value })} placeholder="e.g. Senior Consultant" />
          </div>
          <div>
            <Label>Job Description</Label>
            <textarea
              value={newJob.description}
              onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
              placeholder="Describe the role and responsibilities..."
              rows={3}
              className="w-full px-4 py-2.5 bg-white border border-amana-sec-6 rounded-xl outline-none text-sm text-amana-black shadow-sm focus:border-amana-blue focus:ring-2 focus:ring-amana-blue/15 hover:border-amana-sec-7/30 transition-all duration-200 resize-none"
            />
          </div>
          <div>
            <Label>Key Qualification</Label>
            <textarea
              value={newJob.qualifications}
              onChange={(e) => setNewJob({ ...newJob, qualifications: e.target.value })}
              placeholder="List key qualifications required..."
              rows={3}
              className="w-full px-4 py-2.5 bg-white border border-amana-sec-6 rounded-xl outline-none text-sm text-amana-black shadow-sm focus:border-amana-blue focus:ring-2 focus:ring-amana-blue/15 hover:border-amana-sec-7/30 transition-all duration-200 resize-none"
            />
          </div>
          <div>
            <Label>Google Form Link</Label>
            <Input value={newJob.formLink} onChange={(e) => setNewJob({ ...newJob, formLink: e.target.value })} placeholder="https://docs.google.com/forms/..." />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button variant="primary" className="flex-1" onClick={handleAddJob}>Publish Job</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!showTakedownModal} onClose={() => setShowTakedownModal(null)} title="Takedown Job Listing">
        <p className="text-sm text-amana-sec-7 mb-6">
          Are you sure you want to takedown <strong className="text-amana-black">{showTakedownModal?.title}</strong>?
          This will close the listing and remove it from active job boards.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setShowTakedownModal(null)}>Cancel</Button>
          <Button variant="danger" className="flex-1" onClick={() => showTakedownModal && handleTakedown(showTakedownModal)}>Yes, Takedown</Button>
        </div>
      </Modal>
    </PageLayout>
  );
}