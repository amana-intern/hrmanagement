'use client';

import React, { useState, useRef } from 'react';
import SidebarUser from '../../components/Sidebar/SidebarUser/Sidebaruser';
import { PageLayout, Card, CardSection, Button } from '../../components/ui';

interface Certification {
  id: string;
  title: string;
  fileUrl: string;
  fileName: string;
}

export default function CareerHubPage() {
  const [hasTakenAssessment, setHasTakenAssessment] = useState(false);
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  const [cvFile, setCvFile] = useState<{ name: string; url: string } | null>({
    name: 'CV_User_Latest.pdf',
    url: '',
  });
  const cvInputRef = useRef<HTMLInputElement>(null);
  const [certifications, setCertifications] = useState<Certification[]>([
    { id: '1', title: 'Certification IT Engineer', fileUrl: '', fileName: 'Certification_it_engineer.pdf' },
    { id: '2', title: 'Certification Matlab Course', fileUrl: '', fileName: 'Certification_matlab.pdf' },
  ]);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [editingCertId, setEditingCertId] = useState<string | null>(null);
  const [certTitleInput, setCertTitleInput] = useState('');
  const [selectedCertFile, setSelectedCertFile] = useState<File | null>(null);
  const [previewPdf, setPreviewPdf] = useState<{ title: string; url: string } | null>(null);

  const handleCompleteAssessment = () => {
    setHasTakenAssessment(true);
    setIsAssessmentModalOpen(false);
  };

  const handleCvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setCvFile({ name: file.name, url: URL.createObjectURL(file) });
    } else {
      alert('Harap unggah file berformat .pdf!');
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

  const handleSaveCertification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!certTitleInput.trim()) { alert('Title Must Be Filled!'); return; }
    const fileUrl = selectedCertFile ? URL.createObjectURL(selectedCertFile) : '';
    const fileName = selectedCertFile ? selectedCertFile.name : 'document.pdf';
    if (editingCertId) {
      setCertifications((prev) =>
        prev.map((item) => item.id === editingCertId ? { ...item, title: certTitleInput, ...(selectedCertFile && { fileUrl, fileName }) } : item)
      );
    } else {
      setCertifications((prev) => [...prev, { id: Date.now().toString(), title: certTitleInput, fileUrl, fileName }]);
    }
    setIsCertModalOpen(false);
  };

  const handleDeleteCertification = (id: string) => {
    if (window.confirm('Are you sure to delete this certification?')) {
      setCertifications((prev) => prev.filter((item) => item.id !== id));
      setIsCertModalOpen(false);
    }
  };

  const handleViewPdf = (title: string, url: string) => {
    if (!url) { alert(`Opening PDF Simulation: ${title}`); return; }
    setPreviewPdf({ title, url });
  };

  return (
    <PageLayout sidebar={<SidebarUser />}>

      <Card padding="lg" className="mb-6 animate-fade-in delay-100">
        <CardSection title="Competency Assessment Test">
          <div className="p-4 rounded-xl bg-amana-white border border-amana-sec-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              {hasTakenAssessment ? (
                <div className="flex items-center gap-2 text-amana-sec-8 font-semibold text-sm sm:text-base">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>You have taken your assessment test!</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-amana-sec-5 font-semibold text-sm sm:text-base">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Please take your assessment test!</span>
                </div>
              )}
            </div>
            <Button
              variant={hasTakenAssessment ? 'secondary' : 'primary'}
              onClick={() => hasTakenAssessment ? setHasTakenAssessment(false) : setIsAssessmentModalOpen(true)}
            >
              {hasTakenAssessment ? 'Reset Status' : 'Take Assessment'}
            </Button>
          </div>
        </CardSection>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card padding="lg" className="flex flex-col justify-between animate-fade-in delay-200">
          <div>
            <CardSection title="Latest CV">
              <div className="border-2 border-dashed border-amana-sec-6 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[200px] bg-amana-white hover:border-amana-blue/30 transition-all duration-200">
                <img src="/icon/BCarrerHub.png" alt="CV Icon" className="w-14 h-14 object-contain mb-3" />
                <p className="font-semibold text-amana-black text-center text-sm">{cvFile ? cvFile.name : 'No CV Uploaded'}</p>
                <p className="text-xs text-amana-sec-7 mt-1 font-light">Format PDF (Max 5MB)</p>
              </div>
            </CardSection>
          </div>
          <input type="file" ref={cvInputRef} onChange={handleCvChange} accept="application/pdf" className="hidden" />
          <div className="flex gap-3 mt-6">
            <Button variant="secondary" className="flex-1" onClick={() => cvFile && handleViewPdf('Latest CV', cvFile.url)}>View</Button>
            <Button variant="primary" className="flex-1" onClick={() => cvInputRef.current?.click()}>Update</Button>
          </div>
        </Card>

        <Card padding="lg" className="flex flex-col justify-between animate-fade-in delay-300">
          <div>
            <CardSection title="Latest Certification">
              <div className="flex flex-col gap-3 max-h-[200px] overflow-y-auto pr-1">
                {certifications.map((cert) => (
                  <div key={cert.id} className="flex items-center justify-between p-3 border border-amana-sec-6 rounded-xl bg-amana-white hover:border-amana-blue/20 hover:shadow-sm transition-all duration-200">
                    <div className="flex items-center gap-3 overflow-hidden mr-2">
                      <img src="/icon/BCarrerHub.png" alt="Cert" className="w-5 h-5 flex-shrink-0" />
                      <span className="font-semibold text-sm truncate text-amana-black">{cert.title}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button variant="ghost" onClick={() => handleViewPdf(cert.title, cert.fileUrl)}>View</Button>
                      <Button variant="secondary" onClick={() => openUpdateCertModal(cert)}>Update</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardSection>
          </div>
          <div className="mt-6 border-t border-amana-sec-6 pt-4 flex justify-end">
            <Button variant="secondary" onClick={openAddCertModal}>+ Add</Button>
          </div>
        </Card>
      </div>

      {isCertModalOpen && (
        <div className="fixed inset-0 z-50 bg-amana-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl p-6 relative">
            <button onClick={() => setIsCertModalOpen(false)} className="absolute top-5 right-5 text-amana-sec-7 hover:text-amana-black transition p-1 hover:bg-amana-sec-6/30 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h3 className="text-2xl font-semibold text-amana-blue mb-6">{editingCertId ? 'Update Certification' : 'Upload Certification'}</h3>
            <form onSubmit={handleSaveCertification} className="space-y-5">
              <div>
                <Label>Certification Title</Label>
                <input type="text" required placeholder="Certification Title" value={certTitleInput}
                  onChange={(e) => setCertTitleInput(e.target.value)}
                  className="w-full px-4 py-2.5 border border-amana-sec-6 rounded-xl focus:ring-2 focus:ring-amana-blue/15 focus:border-amana-blue outline-none text-sm transition-all" />
              </div>
              <div>
                <Label>Certification Document (.pdf)</Label>
                <div className="group relative border-2 border-dashed border-amana-sec-6 rounded-2xl p-10 flex flex-col items-center justify-center bg-amana-white hover:border-amana-blue/40 hover:bg-white transition-all duration-200 cursor-pointer">
                  <input type="file" accept="application/pdf" onChange={(e) => setSelectedCertFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                  <img src="/icon/BUpload.png" alt="" className="w-12 h-12 object-contain mb-3" />
                  <p className="text-sm font-semibold text-amana-black">{selectedCertFile ? selectedCertFile.name : 'Drag Certification PDF Here'}</p>
                  <p className="text-xs text-amana-sec-7 mt-1">or Click to Select File</p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3">
                {editingCertId ? (
                  <Button variant="secondary" onClick={() => handleDeleteCertification(editingCertId)}>Delete</Button>
                ) : <div />}
                <div className="flex gap-3">
                  <Button variant="ghost" onClick={() => setIsCertModalOpen(false)}>Cancel</Button>
                  <Button type="submit">{editingCertId ? 'Save Changes' : 'Upload'}</Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAssessmentModalOpen && (
        <div className="fixed inset-0 z-50 bg-amana-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 relative shadow-2xl">
            <h3 className="text-xl font-semibold text-amana-blue mb-3">Competency Assessment</h3>
            <p className="text-sm text-amana-sec-7-5 mb-6 font-light">Simulation Assessment Test</p>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setIsAssessmentModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleCompleteAssessment}>Finish Test</Button>
            </div>
          </div>
        </div>
      )}

      {previewPdf && (
        <div className="fixed inset-0 z-50 bg-amana-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl h-[80vh] rounded-2xl flex flex-col relative overflow-hidden shadow-2xl animate-scale-in">
            <div className="p-4 border-b border-amana-sec-6 flex items-center justify-between bg-amana-white">
              <h4 className="font-semibold text-amana-black">{previewPdf.title}</h4>
              <button onClick={() => setPreviewPdf(null)} className="text-amana-sec-7 hover:text-amana-black transition p-1 hover:bg-amana-sec-6/30 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 p-4 bg-amana-white">
              {previewPdf.url ? (
                <iframe src={previewPdf.url} className="w-full h-full rounded-xl border border-amana-sec-6" title="PDF" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-amana-sec-7">
                  <img src="/icon/BCarrerHub.png" alt="Preview" className="w-16 h-16 mb-3 opacity-50" />
                  <p className="font-semibold text-sm">PDF Preview Simulation</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-semibold text-amana-black mb-1.5">{children}</label>;
}
