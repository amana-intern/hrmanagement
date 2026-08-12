'use client';

import { useEffect, useMemo, useState } from 'react';
import PageTopBar from '../../components/layout/PageTopBar';
import QuickSearchBox from '../../components/data-display/QuickSearchBox';
import SectionCard from '../../components/layout/SectionCard';
import DataTable from '../../components/data-display/DataTable';
import type { DataTableColumn } from '../../components/data-display/DataTable';
import Button from '../../components/forms/Button';
import Modal from '../../components/feedback/Modal';
import EmployeeDetailsModal, { AssessmentBadge } from '../../components/data-display/EmployeeDetailsModal';
import TextField from '../../components/forms/TextField';
import SelectField from '../../components/forms/SelectField';
import AssessmentManager from '../../components/hr/AssessmentManager';
import AssessmentResultView from '../../components/hr/AssessmentResultView';

const OPS_GRADES = ['Head', 'Lead/Coordinator', 'Senior Officer', 'Officer', 'Junior Officer'];
const NON_OPS_GRADES = ['Partner', 'Principal', 'Senior Specialist', 'Specialist', 'Senior Associate', 'Associate', 'Senior Analyst', 'Analyst'];
const LEADER_GRADES = ['Head', 'Partner'];
const BASE_NON_EMPLOYEE_ROLES = ['partner', 'admin hr', 'admin ops'];
const CONTRACT_TYPE_OPTIONS = ['Contract', 'Permanent'];
const DEPARTMENT_LABELS: Record<string, string> = {
  health: 'Health & Wellbeing',
  digital: 'Digital & Finance',
  education: 'Education & HR',
  ops: 'Operations',
};

interface Certificate {
  idSertifikat: string;
  judul: string;
  fileName: string;
  fileURL: string | null;
}

interface Employee {
  idKaryawan: string;
  nama: string;
  email: string;
  grade: string;
  department: string;
  roleLabel: string;
  tipeKontrak?: string;
  noTelepon: string;
  tanggalLahir: string | null;
  certificates: Certificate[];
  assessment: {
    idSubmission: string;
    technicalSkills: string | null;
    selfDevelopmentAreas: string | null;
    tanggalSelesai: string;
    answers: Record<string, number>;
    bidangSkor: Record<string, number | null>;
  } | null;
}

interface Question {
  idPertanyaan: string;
  teks: string;
}

interface Category {
  idKategoriAsm: string;
  namaKategori: string;
  questions: Question[];
}

type RosterRow = Employee & { id: string };
type AssessmentRow = Employee & { id: string };

const DEPARTMENT_OPTION_LIST = Object.keys(DEPARTMENT_LABELS);

export default function TalentRosterPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [assessmentName, setAssessmentName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');

  const [bidang, setBidang] = useState('');
  const [minSkor, setMinSkor] = useState('');

  const [assessmentModal, setAssessmentModal] = useState<Employee | null>(null);
  const [certModal, setCertModal] = useState<Employee | null>(null);
  const [detailsModal, setDetailsModal] = useState<Employee | null>(null);
  const [view, setView] = useState<'roster' | 'assessment' | 'kelola'>('roster');

  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [addingUser, setAddingUser] = useState(false);
  const [addUserMsg, setAddUserMsg] = useState('');
  const [newUser, setNewUser] = useState({
    nama: '',
    email: '',
    noTelepon: '',
    namaRole: '',
    grade: '',
    department: '',
    tanggalLahir: '',
    tanggalMasuk: '',
    tanggalBerakhir: '',
    tipeKontrak: '',
  });
  const [customGrade, setCustomGrade] = useState('');

  const [deleteModal, setDeleteModal] = useState<Employee | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState('');

  const [editModal, setEditModal] = useState<Employee | null>(null);
  const [editForm, setEditForm] = useState({ department: '', grade: '', roleLabel: '' });
  const [customEditGrade, setCustomEditGrade] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [editMsg, setEditMsg] = useState('');

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/hr/talent-roster', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setEmployees((data.list ?? []) as Employee[]);
        setCategories((data.openAssessment?.categories ?? []) as Category[]);
        setAssessmentName(data.openAssessment?.judul ?? null);
      }
      setLoading(false);
    })();
  }, []);

  const gradeOptions = useMemo(
    () => (newUser.department === 'ops' ? OPS_GRADES : newUser.department ? NON_OPS_GRADES : []),
    [newUser.department]
  );
  const isLeaderGrade = LEADER_GRADES.includes(newUser.grade.toLowerCase());

  const filtered = useMemo(() => {
    let rows = employees.filter((e) => e.nama.toLowerCase().includes(appliedQuery.toLowerCase()));
    if (bidang) {
      let scored = rows.filter((e) => typeof e.assessment?.bidangSkor?.[bidang] === 'number');
      if (minSkor) {
        const min = Number(minSkor);
        if (!Number.isNaN(min)) {
          scored = scored.filter((e) => (e.assessment!.bidangSkor![bidang] ?? 0) >= min);
        }
      }
      rows = [...scored].sort(
        (a, b) => (b.assessment?.bidangSkor?.[bidang] ?? -1) - (a.assessment?.bidangSkor?.[bidang] ?? -1)
      );
    }
    return rows;
  }, [employees, appliedQuery, bidang, minSkor]);

  const rosterRows: RosterRow[] = useMemo(() => filtered.map((e) => ({ ...e, id: e.idKaryawan })), [filtered]);

  const assessmentRows: AssessmentRow[] = useMemo(() => {
    let rows = employees.filter((e) => e.assessment).filter((e) => e.nama.toLowerCase().includes(appliedQuery.toLowerCase()));
    if (bidang) {
      rows = rows.filter((e) => typeof e.assessment?.bidangSkor?.[bidang] === 'number');
      if (minSkor) {
        const min = Number(minSkor);
        if (!Number.isNaN(min)) {
          rows = rows.filter((e) => (e.assessment!.bidangSkor![bidang] ?? 0) >= min);
        }
      }
      rows = [...rows].sort(
        (a, b) => (b.assessment?.bidangSkor?.[bidang] ?? -1) - (a.assessment?.bidangSkor?.[bidang] ?? -1)
      );
    } else {
      rows = [...rows].sort((a, b) => a.nama.localeCompare(b.nama));
    }
    return rows.map((e) => ({ ...e, id: e.idKaryawan }));
  }, [employees, appliedQuery, bidang, minSkor]);

  const handleAddUser = async () => {
    if (!newUser.nama.trim() || !newUser.email.trim()) {
      setAddUserMsg('Nama & Email wajib diisi');
      return;
    }
    if (!newUser.department) {
      setAddUserMsg('Department wajib diisi');
      return;
    }
    const gradeVal = newUser.grade === '__other__' ? customGrade.trim() : newUser.grade.trim();
    if (!newUser.grade.trim()) {
      setAddUserMsg('Grade wajib diisi');
      return;
    }
    if (newUser.grade === '__other__' && !gradeVal) {
      setAddUserMsg('Custom Grade wajib diisi');
      return;
    }
    const roleName = isLeaderGrade ? 'Partner' : newUser.namaRole.trim();
    if (!roleName) {
      setAddUserMsg('Role wajib diisi');
      return;
    }
    if (!isLeaderGrade && BASE_NON_EMPLOYEE_ROLES.includes(roleName.toLowerCase())) {
      setAddUserMsg('Role Partner/Admin HR/Admin OPS hanya untuk grade Head/Partner');
      return;
    }
    if (!newUser.tipeKontrak) {
      setAddUserMsg('Contract Type wajib diisi');
      return;
    }
    setAddingUser(true);
    setAddUserMsg('');
    try {
      const res = await fetch('/api/hr/talent-roster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama: newUser.nama,
          email: newUser.email,
          noTelepon: newUser.noTelepon || undefined,
          namaRole: roleName,
          namaGrade: gradeVal || undefined,
          department: newUser.department || undefined,
          tanggalLahir: newUser.tanggalLahir || undefined,
          tanggalMasuk: newUser.tanggalMasuk || undefined,
          tanggalBerakhir: newUser.tanggalBerakhir || undefined,
          tipeKontrak: newUser.tipeKontrak,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddUserMsg(data?.error || 'Gagal menambah pengguna');
        return;
      }
      setNewUser({ nama: '', email: '', noTelepon: '', namaRole: '', grade: '', department: '', tanggalLahir: '', tanggalMasuk: '', tanggalBerakhir: '', tipeKontrak: '' });
      setCustomGrade('');
      const res2 = await fetch('/api/hr/talent-roster', { cache: 'no-store' });
      if (res2.ok) {
        const d2 = await res2.json();
        setEmployees((d2.list ?? []) as Employee[]);
      }
      setIsAddUserOpen(false);
      alert(`Talent "${newUser.nama}" berhasil ditambahkan. Password: "${data.password}"`);
      setAddUserMsg('');
    } catch {
      setAddUserMsg('Terjadi kesalahan jaringan');
    } finally {
      setAddingUser(false);
    }
  };

  const handleOpenEdit = (e: Employee) => {
    setEditForm({
      department: e.department && e.department !== '-' ? e.department : '',
      grade: e.grade && e.grade !== '-' ? e.grade : '',
      roleLabel: e.roleLabel && e.roleLabel !== '-' ? e.roleLabel : '',
    });
    setCustomEditGrade('');
    setEditMsg('');
    setEditModal(e);
  };

  const handleSaveEdit = async () => {
    if (!editModal) return;
    if (!editForm.department) {
      setEditMsg('Department wajib diisi');
      return;
    }
    const gradeVal = editForm.grade === '__other__' ? customEditGrade.trim() : editForm.grade.trim();
    if (!gradeVal) {
      setEditMsg('Grade wajib diisi');
      return;
    }
    const isLeader = LEADER_GRADES.includes(gradeVal.toLowerCase());
    const roleVal = isLeader ? 'Partner' : editForm.roleLabel.trim();
    if (!roleVal) {
      setEditMsg('Role wajib diisi');
      return;
    }
    setSavingEdit(true);
    setEditMsg('');
    try {
      const res = await fetch(`/api/hr/talent-roster/${editModal.idKaryawan}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          department: editForm.department,
          namaGrade: gradeVal,
          namaRole: roleVal,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEditMsg(data?.error || 'Gagal menyimpan perubahan');
        return;
      }
      const res2 = await fetch('/api/hr/talent-roster', { cache: 'no-store' });
      if (res2.ok) {
        const d2 = await res2.json();
        setEmployees((d2.list ?? []) as Employee[]);
      }
      setEditModal(null);
      setEditMsg('');
    } catch {
      setEditMsg('Terjadi kesalahan jaringan');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteModal) return;
    setDeletingUser(true);
    setDeleteMsg('');
    try {
      const res = await fetch(`/api/hr/talent-roster/${deleteModal.idKaryawan}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        setDeleteMsg(data?.error || 'Gagal menghapus karyawan');
        return;
      }
      const res2 = await fetch('/api/hr/talent-roster', { cache: 'no-store' });
      if (res2.ok) {
        const d2 = await res2.json();
        setEmployees((d2.list ?? []) as Employee[]);
      }
      setDeleteModal(null);
      setDeleteMsg('');
    } catch {
      setDeleteMsg('Terjadi kesalahan jaringan');
    } finally {
      setDeletingUser(false);
    }
  };

  const departmentLabel = (d: string) => DEPARTMENT_LABELS[d] || d || '-';
  const contractLabel = (t?: string) => (t === 'TETAP' ? 'Permanent' : 'Contract');

  const rosterColumns: DataTableColumn<RosterRow>[] = [
    { key: 'nama', label: 'Name' },
    { key: 'grade', label: 'Grade' },
    { key: 'department', label: 'Department', render: (e) => departmentLabel(e.department) },
    { key: 'roleLabel', label: 'Role' },
    { key: 'tipeKontrak', label: 'Contract Type', render: (e) => contractLabel(e.tipeKontrak) },
    {
      key: 'id',
      label: 'Assessment',
      render: (e) => (
        <button onClick={() => setAssessmentModal(e)} className="w-full">
          <AssessmentBadge done={!!e.assessment} fullWidth />
        </button>
      ),
    },
    {
      key: 'id',
      label: 'Certificate',
      render: (e) => (
        <Button variant="primary" size="sm" className="w-full whitespace-nowrap" onClick={() => setCertModal(e)}>
          {e.certificates.length} docs
        </Button>
      ),
    },
    {
      key: 'id',
      label: 'Details',
      render: (e) => (
        <Button variant="primary" size="sm" className="w-full whitespace-nowrap" onClick={() => setDetailsModal(e)}>
          Details
        </Button>
      ),
    },
    {
      key: 'id',
      label: 'Action',
      render: (e) => (
        <Button variant="primary" size="sm" className="w-full whitespace-nowrap" onClick={() => handleOpenEdit(e)}>
          Edit
        </Button>
      ),
    },
  ];

  const assessmentColumns: DataTableColumn<AssessmentRow>[] = [
    { key: 'nama', label: 'Name' },
    { key: 'grade', label: 'Grade' },
    { key: 'department', label: 'Department', render: (e) => departmentLabel(e.department) },
    {
      key: 'id',
      label: 'Rata-rata Level',
      render: (e) => (bidang ? (e.assessment?.bidangSkor?.[bidang] ?? '-') : '-'),
    },
    { key: 'assessment', label: '1-3 Technical Skills', render: (e) => <span className="block max-w-[200px] whitespace-pre-wrap text-[13px] text-amana-neutral-500">{e.assessment?.technicalSkills || '-'}</span> },
    { key: 'assessment', label: 'Self-Development Areas', render: (e) => <span className="block max-w-[200px] whitespace-pre-wrap text-[13px] text-amana-neutral-500">{e.assessment?.selfDevelopmentAreas || '-'}</span> },
  ];

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <>
      <div className="w-full h-full flex flex-col gap-3">
        <PageTopBar showGreeting section="Career Hub" page="Talent Roster" />

        <div className="flex gap-2 flex-shrink-0">
          {(['roster', 'assessment', 'kelola'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                view === v
                  ? 'bg-amana-primary-500 text-amana-neutral-100'
                  : 'bg-amana-neutral-100 border border-amana-neutral-300 text-amana-neutral-500 hover:text-amana-primary-500'
              }`}
            >
              {v === 'roster' ? 'Talent Roster' : v === 'assessment' ? 'View All Employee Assessment' : 'Kelola Assessment'}
            </button>
          ))}
        </div>

        {view === 'kelola' ? (
          <AssessmentManager />
        ) : (
          <>
            <QuickSearchBox
              title="Search Talent"
              subtitle="Search talent using integrated AMANA AI"
              query={query}
              onQueryChange={setQuery}
              onSearch={() => setAppliedQuery(query)}
              placeholder="Search by employee name..."
              open={searchOpen}
              onToggle={() => setSearchOpen((v) => !v)}
            />

            <div className="flex-shrink-0 flex flex-wrap items-center gap-3 bg-amana-neutral-100 rounded-[5px] border border-amana-primary-500 shadow-sm px-5 py-2.5">
              <label className="text-[16px] font-semibold text-amana-neutral-500">Bidang:</label>
              <select
                value={bidang}
                onChange={(e) => { setBidang(e.target.value); setMinSkor(''); }}
                className="border border-amana-neutral-300 rounded-[13px] px-3 py-2.5 text-[16px] text-amana-neutral-500 bg-amana-neutral-100 focus:outline-none focus:border-amana-primary-500"
              >
                <option value="">Semua bidang</option>
                {categories.map((c) => (
                  <option key={c.idKategoriAsm} value={c.idKategoriAsm}>{c.namaKategori}</option>
                ))}
              </select>
              {bidang && (
                <input
                  type="number"
                  placeholder="Min skor"
                  value={minSkor}
                  onChange={(e) => setMinSkor(e.target.value)}
                  className="w-28 border border-amana-neutral-300 rounded-[13px] px-3 py-2.5 text-[16px] text-amana-neutral-500 placeholder:text-amana-neutral-300 focus:outline-none focus:border-amana-primary-500"
                />
              )}
              {assessmentName && (
                <span className="text-[13px] text-amana-neutral-400">Assessment: {assessmentName}</span>
              )}
            </div>

            {view === 'roster' ? (
              <SectionCard
                title="Talent Roster"
                subtitle={`${rosterRows.length} employee(s)`}
                scroll
                action={
                  <Button variant="primary" size="md" onClick={() => { setIsAddUserOpen(true); setAddUserMsg(''); }}>
                    Add New Talent
                  </Button>
                }
              >
                <DataTable key="roster" columns={rosterColumns} rows={rosterRows} defaultSortKey="nama" emptyMessage="Tidak ada karyawan." />
              </SectionCard>
            ) : (
              <SectionCard title="Employee Assessment" subtitle={`${assessmentRows.length} employee(s)`} scroll>
                <DataTable key="assessment" columns={assessmentColumns} rows={assessmentRows} defaultSortKey="nama" emptyMessage="Belum ada karyawan yang mengisi assessment." />
              </SectionCard>
            )}
          </>
        )}
      </div>

      {detailsModal && (
        <EmployeeDetailsModal
          employee={{
            name: detailsModal.nama,
            grade: detailsModal.grade,
            department: departmentLabel(detailsModal.department),
            email: detailsModal.email,
            phone: detailsModal.noTelepon || '-',
            assessmentDone: !!detailsModal.assessment,
            assessmentName: assessmentName ?? undefined,
            certificates: detailsModal.certificates.map((c) => c.judul),
          }}
          onClose={() => setDetailsModal(null)}
          onViewAssessment={() => setAssessmentModal(detailsModal)}
        />
      )}

      {assessmentModal && (
        <Modal title={`Assessment - ${assessmentModal.nama || ''}`} onClose={() => setAssessmentModal(null)} maxWidth="max-w-6xl" className="max-h-[90vh]">
          <div className="flex-1 min-h-0 overflow-y-auto scroll-smooth p-5 flex flex-col gap-4">
            {assessmentModal.assessment ? (
              <AssessmentResultView categories={categories} assessment={assessmentModal.assessment} />
            ) : (
              <p className="text-sm text-amana-neutral-400">
                {assessmentName ? `Belum mengisi ${assessmentName}.` : 'Belum ada data assessment.'}
              </p>
            )}
          </div>
        </Modal>
      )}

      {certModal && (
        <Modal title={`Certificates - ${certModal.nama || ''}`} onClose={() => setCertModal(null)} maxWidth="max-w-2xl" className="max-h-[90vh]">
          <div className="flex-1 min-h-0 overflow-y-auto scroll-smooth p-5 flex flex-col gap-2.5">
            {certModal.certificates.length > 0 ? (
              certModal.certificates.map((cert) => (
                <div key={cert.idSertifikat} className="flex items-center justify-between p-3 rounded-xl bg-amana-neutral-200 border border-amana-neutral-300">
                  <span className="text-sm text-amana-neutral-500">{cert.judul}</span>
                  <Button variant="primary" size="sm" onClick={() => (cert.fileURL ? window.open(cert.fileURL, '_blank') : alert(`Viewing: ${cert.fileName}`))}>
                    View
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-amana-neutral-400">No certificates uploaded.</p>
            )}
          </div>
        </Modal>
      )}

      {isAddUserOpen && (
        <Modal title="Add New Talent" onClose={() => { setIsAddUserOpen(false); setAddUserMsg(''); setCustomGrade(''); }} maxWidth="max-w-3xl" className="max-h-[90vh]">
          <div className="flex-1 min-h-0 overflow-y-auto scroll-smooth p-5 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <TextField label="Talent Email" value={newUser.email} onChange={(v) => setNewUser((p) => ({ ...p, email: v }))} placeholder="e.g.: name@company" />
            <TextField label="Talent Name" value={newUser.nama} onChange={(v) => setNewUser((p) => ({ ...p, nama: v }))} placeholder="Full Name" />
            <TextField label="Birth Date" type="date" value={newUser.tanggalLahir} onChange={(v) => setNewUser((p) => ({ ...p, tanggalLahir: v }))} />
            <TextField label="Phone Number" value={newUser.noTelepon} onChange={(v) => setNewUser((p) => ({ ...p, noTelepon: v }))} placeholder="e.g.: 0812-3456-7890" />

            <SelectField
              label="Department"
              value={newUser.department}
              onChange={(v) => setNewUser((p) => ({ ...p, department: v, grade: '' }))}
              options={DEPARTMENT_OPTION_LIST}
              labels={DEPARTMENT_LABELS}
              placeholder="Choose Department"
            />

            <div>
              <SelectField
                label="Grade"
                value={newUser.grade === '__other__' ? '__other__' : newUser.grade}
                onChange={(v) => setNewUser((p) => ({ ...p, grade: v }))}
                options={[...gradeOptions, '__other__']}
                labels={{ __other__: 'Other / Custom' }}
                disabled={!newUser.department}
                placeholder={newUser.department ? 'Choose Grade' : 'Select department first'}
              />
              {newUser.grade === '__other__' && (
                <div className="pt-2">
                  <TextField value={customGrade} onChange={setCustomGrade} placeholder="Custom Grade, e.g. Intern" label="Custom Grade" />
                </div>
              )}
            </div>

            <div>
              <TextField
                label="Role"
                value={isLeaderGrade ? 'Partner' : newUser.namaRole}
                onChange={(v) => setNewUser((p) => ({ ...p, namaRole: v }))}
                disabled={isLeaderGrade}
                placeholder="e.g.: Software Engineer, Data Analyst"
              />
              {isLeaderGrade && <p className="pt-1.5 text-[12px] text-amana-neutral-400">Grade Head/Partner automatically becomes role Partner.</p>}
            </div>

            <SelectField
              label="Contract Type"
              value={newUser.tipeKontrak}
              onChange={(v) => setNewUser((p) => ({ ...p, tipeKontrak: v }))}
              options={CONTRACT_TYPE_OPTIONS}
              placeholder="Choose Contract Type"
            />

            <TextField label="Start Date" type="date" value={newUser.tanggalMasuk} onChange={(v) => setNewUser((p) => ({ ...p, tanggalMasuk: v }))} />
            {newUser.tipeKontrak === 'Contract' && (
              <TextField label="End Date" type="date" value={newUser.tanggalBerakhir} onChange={(v) => setNewUser((p) => ({ ...p, tanggalBerakhir: v }))} />
            )}
          </div>

          {addUserMsg && (
            <p className="px-5 pb-1 text-[13px] font-medium text-amana-danger-500">{addUserMsg}</p>
          )}

          <div className="flex-shrink-0 flex justify-end gap-3 px-5 py-4 border-t border-amana-neutral-200">
            <Button variant="ghost" onClick={() => { setIsAddUserOpen(false); setAddUserMsg(''); setCustomGrade(''); }}>
              Cancel
            </Button>
            <Button variant="primary" size="lg" disabled={addingUser} onClick={handleAddUser}>
              {addingUser ? 'Saving...' : 'Add Talent'}
            </Button>
          </div>
        </Modal>
      )}

      {editModal && (
        <Modal
          title={`Edit Talent - ${editModal.nama || ''}`}
          onClose={() => setEditModal(null)}
          maxWidth="max-w-2xl"
          className="max-h-[90vh]"
        >
          <div className="flex-1 min-h-0 overflow-y-auto scroll-smooth p-5 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <SelectField
              label="Department"
              value={editForm.department}
              onChange={(v) => setEditForm((p) => ({ ...p, department: v, grade: '' }))}
              options={DEPARTMENT_OPTION_LIST}
              labels={DEPARTMENT_LABELS}
              placeholder="Choose Department"
            />

            <div>
              <SelectField
                label="Grade"
                value={editForm.grade === '__other__' ? '__other__' : editForm.grade}
                onChange={(v) => setEditForm((p) => ({ ...p, grade: v }))}
                options={[...(editForm.department === 'ops' ? OPS_GRADES : editForm.department ? NON_OPS_GRADES : []), '__other__']}
                labels={{ __other__: 'Other / Custom' }}
                disabled={!editForm.department}
                placeholder={editForm.department ? 'Choose Grade' : 'Select department first'}
              />
              {editForm.grade === '__other__' && (
                <div className="pt-2">
                  <TextField value={customEditGrade} onChange={setCustomEditGrade} placeholder="Custom Grade, e.g. Intern" label="Custom Grade" />
                </div>
              )}
            </div>

            <div>
              <TextField
                label="Role"
                value={LEADER_GRADES.includes((editForm.grade === '__other__' ? customEditGrade : editForm.grade).toLowerCase()) ? 'Partner' : editForm.roleLabel}
                onChange={(v) => setEditForm((p) => ({ ...p, roleLabel: v }))}
                disabled={LEADER_GRADES.includes((editForm.grade === '__other__' ? customEditGrade : editForm.grade).toLowerCase())}
                placeholder="e.g.: Software Engineer, Data Analyst"
              />
              {LEADER_GRADES.includes((editForm.grade === '__other__' ? customEditGrade : editForm.grade).toLowerCase()) && (
                <p className="pt-1.5 text-[12px] text-amana-neutral-400">Grade Head/Partner automatically becomes role Partner.</p>
              )}
            </div>
          </div>

          {editMsg && (
            <p className="px-5 pb-1 text-[13px] font-medium text-amana-danger-500">{editMsg}</p>
          )}

          <div className="flex-shrink-0 flex items-center justify-between gap-3 px-5 py-4 border-t border-amana-neutral-200">
            <Button
              variant="danger"
              onClick={() => {
                setDeleteModal(editModal);
                setEditModal(null);
                setDeleteMsg('');
              }}
            >
              Delete
            </Button>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => { setEditModal(null); setEditMsg(''); setCustomEditGrade(''); }}>
                Cancel
              </Button>
              <Button variant="primary" size="lg" disabled={savingEdit} onClick={handleSaveEdit}>
                {savingEdit ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {deleteModal && (
        <Modal title={`Delete Employee - ${deleteModal.nama || ''}`} onClose={() => setDeleteModal(null)} maxWidth="max-w-md">          <div className="p-5 flex flex-col gap-4">
            <p className="text-sm text-amana-neutral-400">
              Are you sure you want to delete <span className="font-semibold text-amana-neutral-500">{deleteModal.nama}</span>?
              Employee data along with all their records will be permanently deleted and cannot be recovered.
            </p>
            {deleteMsg && <p className="text-[13px] font-medium text-amana-danger-500">{deleteMsg}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setDeleteModal(null)}>Cancel</Button>
              <Button variant="danger" size="lg" disabled={deletingUser} onClick={handleDeleteUser}>
                {deletingUser ? 'Processing...' : 'Delete'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}