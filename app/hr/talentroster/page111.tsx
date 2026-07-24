'use client';

import { useState, useMemo } from 'react';
import SidebarHR from '../../components/Sidebar/SidebarHR/Sidebarhr';
import { PageLayout, PageTitle, Table, Badge, Input, Button, Modal } from '../../components/ui';

interface Employee {
  id: number;
  name: string;
  email: string;
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
    { id: 1, name: 'Ahmad Fauzi', email: 'ahmad.fauzi@amana.id', grade: 'Senior Analyst', role: 'Consultant', assessment: 'Done', certificates: 3 },
    { id: 2, name: 'Sari Dewi', email: 'sari.dewi@amana.id', grade: 'Associate', role: 'Consultant', assessment: 'Pending', certificates: 1 },
    { id: 3, name: 'Budi Hartono', email: 'budi.hartono@amana.id', grade: 'Analyst', role: 'Junior Consultant', assessment: 'Done', certificates: 0 },
    { id: 4, name: 'Citra Lestari', email: 'citra.lestari@amana.id', grade: 'Senior Analyst', role: 'Consultant', assessment: 'Done', certificates: 5 },
    { id: 5, name: 'Dimas Prayoga', email: 'dimas.prayoga@amana.id', grade: 'Officer', role: 'Project Manager', assessment: 'Pending', certificates: 2 },
    { id: 6, name: 'Eka Pratiwi', email: 'eka.pratiwi@amana.id', grade: 'Senior Officer', role: 'Lead', assessment: 'Done', certificates: 4 },
  ]);

  const [search, setSearch] = useState('');

  const [sortKey, setSortKey] = useState('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const [assessmentModal, setAssessmentModal] = useState<Employee | null>(null);
  const [certModal, setCertModal] = useState<Employee | null>(null);

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
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase())
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
    { key: 'email', label: 'Email' },
    { key: 'grade', label: 'Grade', sortable: true },
    { key: 'role', label: 'Role', sortable: true },
    { key: 'assessment', label: 'Assessment', align: 'center' as const },
    { key: 'certificates', label: 'Certificates', align: 'center' as const },
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
              <td className="p-4 text-amana-sec-7">{emp.email}</td>
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
          <p className="text-sm text-amana-sec-7 text-center py-4">No assessment data available.</p>
        ))}
      </Modal>

      <Modal open={!!certModal} onClose={() => setCertModal(null)} title={`Certificates - ${certModal?.name || ''}`}>
        {certModal && (certificateData[certModal.id]?.length > 0 ? (
          <div className="space-y-2">
            {certificateData[certModal.id].map((cert, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-amana-sec-6/40 border border-amana-sec-6">
                <span className="text-sm font-medium text-amana-black">{cert.name}</span>
                <Button variant="ghost" onClick={() => alert(`Viewing: ${cert.file}`)}>
                  View
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-amana-sec-7 text-center py-4">No certificates uploaded.</p>
        ))}
      </Modal>
    </PageLayout>
  );
}