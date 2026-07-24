'use client';

import { useState, useMemo } from 'react';
import SidebarHR from '../../components/Sidebar/SidebarHR/Sidebarhr';
import { PageLayout, Input, Button, Modal, Table, Badge } from '../../components/ui';

function EmptyState({ message }: { message: string }) {
  return (
    <div className="p-6 text-center text-amana-sec-7 bg-amana-sec-2/10 border border-amana-sec-6 rounded-xl">
      {message}
    </div>
  );
}

interface Employee {
  id: number;
  name: string;
  email: string;
  phone: string;
  birthDate: string;
  grade: string;
  role: string;
  assessment: 'Done' | 'Pending';
  certificates: number;
}

const assessmentDetailData: Record<number, { testName: string; score: string; status: string }[]> = {
  1: [
    { testName: 'Competency Test A', score: '85/100', status: 'Passed' },
    { testName: 'Skill Assessment B', score: '78/100', status: 'Passed' },
  ],
  2: [],
  3: [
    { testName: 'Competency Test A', score: '92/100', status: 'Passed' },
  ],
  4: [
    { testName: 'Competency Test A', score: '88/100', status: 'Passed' },
    { testName: 'Skill Assessment B', score: '90/100', status: 'Passed' },
    { testName: 'Leadership Test', score: '76/100', status: 'Passed' },
  ],
  5: [],
  6: [
    { testName: 'Competency Test A', score: '95/100', status: 'Passed' },
    { testName: 'Skill Assessment B', score: '82/100', status: 'Passed' },
  ],
};

const certificateData: Record<number, { name: string; file: string }[]> = {
  1: [
    { name: 'Sertifikat Keahlian A', file: 'sertifikat_a.pdf' },
    { name: 'TOEFL Certification', file: 'toefl.pdf' },
    { name: 'Project Management', file: 'pm_cert.pdf' },
  ],
  2: [
    { name: 'Sertifikat Dasar', file: 'dasar.pdf' },
  ],
  3: [],
  4: [
    { name: 'Sertifikat Keahlian A', file: 'sertifikat_a.pdf' },
    { name: 'Sertifikat Keahlian B', file: 'sertifikat_b.pdf' },
    { name: 'TOEFL Certification', file: 'toefl.pdf' },
    { name: 'Leadership Cert', file: 'leadership.pdf' },
    { name: 'Advanced Analytics', file: 'analytics.pdf' },
  ],
  5: [
    { name: 'PMP Certification', file: 'pmp.pdf' },
    { name: 'Agile Master', file: 'agile.pdf' },
  ],
  6: [
    { name: 'Sertifikat Keahlian A', file: 'sertifikat_a.pdf' },
    { name: 'Sertifikat Keahlian B', file: 'sertifikat_b.pdf' },
    { name: 'TOEFL Certification', file: 'toefl.pdf' },
    { name: 'Leadership Cert', file: 'leadership.pdf' },
  ],
};

export default function TalentRosterPage() {
  const [employees] = useState<Employee[]>([
    { id: 1, name: 'Ahmad Fauzi', email: 'ahmad.fauzi@amana.id', phone: '0812-3456-7890', birthDate: '15 Mar 1990', grade: 'Senior Analyst', role: 'Consultant', assessment: 'Done', certificates: 3 },
    { id: 2, name: 'Sari Dewi', email: 'sari.dewi@amana.id', phone: '0813-4567-8901', birthDate: '22 Jul 1992', grade: 'Associate', role: 'Consultant', assessment: 'Pending', certificates: 1 },
    { id: 3, name: 'Budi Hartono', email: 'budi.hartono@amana.id', phone: '0814-5678-9012', birthDate: '10 Nov 1988', grade: 'Analyst', role: 'Junior Consultant', assessment: 'Done', certificates: 0 },
    { id: 4, name: 'Citra Lestari', email: 'citra.lestari@amana.id', phone: '0815-6789-0123', birthDate: '05 Jan 1991', grade: 'Senior Analyst', role: 'Consultant', assessment: 'Done', certificates: 5 },
    { id: 5, name: 'Dimas Prayoga', email: 'dimas.prayoga@amana.id', phone: '0816-7890-1234', birthDate: '18 Sep 1989', grade: 'Officer', role: 'Project Manager', assessment: 'Pending', certificates: 2 },
    { id: 6, name: 'Eka Pratiwi', email: 'eka.pratiwi@amana.id', phone: '0817-8901-2345', birthDate: '30 Apr 1993', grade: 'Senior Officer', role: 'Lead', assessment: 'Done', certificates: 4 },
  ]);

  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [assessmentModal, setAssessmentModal] = useState<Employee | null>(null);
  const [certModal, setCertModal] = useState<Employee | null>(null);
  const [detailsModal, setDetailsModal] = useState<Employee | null>(null);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sorted = useMemo(() => {
    const filtered = employees.filter((e) =>
      e.name.toLowerCase().includes(search.toLowerCase())
    );
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = (a as any)[sortKey] ?? '';
      const bVal = (b as any)[sortKey] ?? '';
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [employees, search, sortKey, sortDir]);

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'grade', label: 'Grade', sortable: true },
    { key: 'role', label: 'Role', sortable: true },
    { key: 'assessment', label: 'Assessment', align: 'center' as const },
    { key: 'certificates', label: 'Certificate', align: 'center' as const },
    { key: 'details', label: 'Details', align: 'center' as const },
  ];

  return (
    <PageLayout sidebar={<SidebarHR />}>
      <div className="flex flex-wrap gap-3 items-center animate-fade-in delay-100">
        <Input
          placeholder="Search employee..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className="animate-slide-up delay-200">
        <Table columns={columns} sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>
          {sorted.map((emp) => (
            <tr key={emp.id} className="hover:bg-amana-blue/[0.03] transition-colors duration-200">
              <td className="p-4 font-semibold text-amana-black">{emp.name}</td>
              <td className="p-4 text-amana-black">{emp.grade}</td>
              <td className="p-4 text-amana-sec-7">{emp.role}</td>
              <td className="p-4 text-center">
                <button onClick={() => setAssessmentModal(emp)}>
                  <Badge variant={emp.assessment === 'Done' ? 'success' : 'pending'}>{emp.assessment}</Badge>
                </button>
              </td>
              <td className="p-4 text-center">
                <button
                  onClick={() => setCertModal(emp)}
                  className="font-semibold text-amana-blue underline underline-offset-2 hover:text-amana-sec-5 transition-colors"
                >
                  {emp.certificates} docs
                </button>
              </td>
              <td className="p-4 text-center">
                <button
                  onClick={() => setDetailsModal(emp)}
                  className="px-3 py-1 text-sm font-medium text-amana-blue border border-amana-blue rounded-xl hover:bg-amana-blue hover:text-white transition-all duration-200"
                >
                  Details
                </button>
              </td>
            </tr>
          ))}
        </Table>
      </div>

      <Modal open={!!assessmentModal} onClose={() => setAssessmentModal(null)} title={`Assessment - ${assessmentModal?.name || ''}`}>
        {assessmentModal && (assessmentDetailData[assessmentModal.id]?.length > 0 ? (
          <div className="space-y-3">
            {assessmentDetailData[assessmentModal.id].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-amana-sec-6/40 border border-amana-sec-6">
                <div>
                  <p className="font-semibold text-sm text-amana-black">{item.testName}</p>
                  <p className="text-xs text-amana-sec-7">Score: {item.score}</p>
                </div>
                <Badge variant={item.status === 'Passed' ? 'success' : 'danger'}>{item.status}</Badge>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message="No assessment data available." />
        ))}
      </Modal>

      <Modal open={!!certModal} onClose={() => setCertModal(null)} title={`Certificates - ${certModal?.name || ''}`}>
        {certModal && (certificateData[certModal.id]?.length > 0 ? (
          <div className="space-y-2">
            {certificateData[certModal.id].map((cert, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-amana-sec-6/40 border border-amana-sec-6">
                <span className="text-sm font-normal text-amana-black">{cert.name}</span>
                <Button variant="ghost" onClick={() => alert(`Viewing: ${cert.file}`)}>
                  View
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message="No certificates uploaded." />
        ))}
      </Modal>

      <Modal open={!!detailsModal} onClose={() => setDetailsModal(null)} title={`Details - ${detailsModal?.name || ''}`}>
        {detailsModal && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-amana-sec-6/40 border border-amana-sec-6">
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-amana-blue/10 text-amana-blue">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-amana-sec-7">Email</p>
                <p className="text-sm font-medium text-amana-black">{detailsModal.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-amana-sec-6/40 border border-amana-sec-6">
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-amana-blue/10 text-amana-blue">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-amana-sec-7">Phone</p>
                <p className="text-sm font-medium text-amana-black">{detailsModal.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-amana-sec-6/40 border border-amana-sec-6">
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-amana-blue/10 text-amana-blue">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-amana-sec-7">Birth Date</p>
                <p className="text-sm font-medium text-amana-black">{detailsModal.birthDate}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </PageLayout>
  );
}
