'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import PageTopBar from '@/app/components/layout/PageTopBar';
import QuickSearchBox from '@/app/components/data-display/QuickSearchBox';
import SectionCard from '@/app/components/layout/SectionCard';
import DataTable from '@/app/components/data-display/DataTable';
import type { DataTableColumn } from '@/app/components/data-display/DataTable';
import Button from '@/app/components/forms/Button';
import Modal from '@/app/components/feedback/Modal';
import StatusModal from '@/app/components/feedback/StatusModal';
import PdfPreviewModal, { PdfPreviewTarget } from '@/app/components/feedback/PdfPreviewModal';
import EmployeeDetailsModal, { AssessmentBadge } from '@/app/components/data-display/EmployeeDetailsModal';
import CareerHistoryModal, { type CareerHistoryEntry } from '@/app/components/data-display/CareerHistoryModal';
import TextField from '@/app/components/forms/TextField';
import SelectField from '@/app/components/forms/SelectField';
import AssessmentResultView from '@/app/components/hr/AssessmentResultView';
import { TableSkeleton } from '@/app/components/feedback/PageSkeleton';
import { DEPARTMENT_LABELS } from '@/lib/constants';

const OPS_GRADES = ['Head', 'Lead/Coordinator', 'Senior Officer', 'Officer', 'Junior Officer'];
const NON_OPS_GRADES = ['Partner', 'Principal', 'Senior Specialist', 'Specialist', 'Senior Associate', 'Associate', 'Senior Analyst', 'Analyst'];
const LEADER_GRADES = ['Head', 'Partner'];
const BASE_NON_EMPLOYEE_ROLES = ['partner', 'admin hr', 'admin ops'];
const CONTRACT_TYPE_OPTIONS = ['Contract', 'Permanent'];
const ACCESS_OPTIONS = ['employee', 'admin_hr', 'admin_ops'];
const ACCESS_LABELS: Record<string, string> = { employee: 'Employee', admin_hr: 'Admin HR', admin_ops: 'Admin OPS' };

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
    answers: Record<string, { level?: number | null; pilihan?: string[] | null; jawabanTeks?: string | null }>;
    bidangSkor: Record<string, number | null>;
  } | null;
}

interface Question {
  idPertanyaan: string;
  teks: string;
  tipeSoal: string | null;
  options: { idOpsi: string; teks: string | null }[];
}

interface Category {
  idKategoriAsm: string;
  namaKategori: string;
  questions: Question[];
}

type RosterRow = Employee & { id: string };

const DEPARTMENT_OPTION_LIST = Object.keys(DEPARTMENT_LABELS);

export default function TalentRosterPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [assessmentName, setAssessmentName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');

  const [assessmentModal, setAssessmentModal] = useState<Employee | null>(null);
  const [detailsModal, setDetailsModal] = useState<Employee | null>(null);
  const [previewPdf, setPreviewPdf] = useState<PdfPreviewTarget | null>(null);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  const [careerHistoryModal, setCareerHistoryModal] = useState<Employee | null>(null);
  const [careerHistory, setCareerHistory] = useState<CareerHistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const openCareerHistory = async (emp: Employee) => {
    setCareerHistoryModal(emp);
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/hr/talent-roster/${emp.idKaryawan}/history`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setCareerHistory(data.list ?? []);
      } else {
        setCareerHistory([]);
      }
    } catch {
      setCareerHistory([]);
    }
    setLoadingHistory(false);
  };

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
    akses: 'employee',
  });
  const [customGrade, setCustomGrade] = useState('');

  const [deleteModal, setDeleteModal] = useState<Employee | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);

  const [editModal, setEditModal] = useState<Employee | null>(null);
  const [editForm, setEditForm] = useState({ department: '', grade: '', roleLabel: '', akses: 'employee' });
  const [customEditGrade, setCustomEditGrade] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [editMsg, setEditMsg] = useState('');
  const [myEmail, setMyEmail] = useState('');

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/me', { cache: 'no-store' });
      if (res.ok) {
        const me = await res.json();
        setMyEmail(me.user?.email ?? '');
      }
    })();
  }, []);

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
  const isPromotedAccess = newUser.akses === 'admin_hr' || newUser.akses === 'admin_ops';

  const filtered = useMemo(
    () => employees.filter((e) => e.nama.toLowerCase().includes(appliedQuery.toLowerCase())),
    [employees, appliedQuery]
  );

  const rosterRows: RosterRow[] = useMemo(() => filtered.map((e) => ({ ...e, id: e.idKaryawan })), [filtered]);

  const handleAddUser = async () => {
    if (!newUser.nama.trim() || !newUser.email.trim()) {
      setAddUserMsg('Name & Email are required');
      return;
    }
    if (!newUser.department) {
      setAddUserMsg('Department is required');
      return;
    }
    const gradeVal = newUser.grade === '__other__' ? customGrade.trim() : newUser.grade.trim();
    if (!newUser.grade.trim()) {
      setAddUserMsg('Grade is required');
      return;
    }
    if (newUser.grade === '__other__' && !gradeVal) {
      setAddUserMsg('Custom Grade is required');
      return;
    }
    const roleName = isLeaderGrade ? 'Partner' : isPromotedAccess ? ACCESS_LABELS[newUser.akses] : newUser.namaRole.trim();
    if (!roleName) {
      setAddUserMsg('Role is required');
      return;
    }
    if (!isLeaderGrade && !isPromotedAccess && BASE_NON_EMPLOYEE_ROLES.includes(roleName.toLowerCase())) {
      setAddUserMsg('Role Partner/Admin HR/Admin OPS is only for grade Head/Partner');
      return;
    }
    if (!newUser.tipeKontrak) {
      setAddUserMsg('Contract Type is required');
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
          akses: newUser.akses,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddUserMsg(data?.error || 'Failed to add user');
        return;
      }
      setNewUser({ nama: '', email: '', noTelepon: '', namaRole: '', grade: '', department: '', tanggalLahir: '', tanggalMasuk: '', tanggalBerakhir: '', tipeKontrak: '', akses: 'employee' });
      setCustomGrade('');
      const res2 = await fetch('/api/hr/talent-roster', { cache: 'no-store' });
      if (res2.ok) {
        const d2 = await res2.json();
        setEmployees((d2.list ?? []) as Employee[]);
      }
      setIsAddUserOpen(false);
      setStatus({ ok: true, text: `Talent "${newUser.nama}" successfully added. Password: "${data.password}"` });
      setAddUserMsg('');
    } catch {
      setAddUserMsg('A network error occurred');
    } finally {
      setAddingUser(false);
    }
  };

  const handleOpenEdit = (e: Employee) => {
    setEditForm({
      department: e.department && e.department !== '-' ? e.department : '',
      grade: e.grade && e.grade !== '-' ? e.grade : '',
      roleLabel: e.roleLabel && e.roleLabel !== '-' ? e.roleLabel : '',
      akses: 'employee',
    });
    setCustomEditGrade('');
    setEditMsg('');
    setEditModal(e);
  };

  const handleSaveEdit = async () => {
    if (!editModal) return;
    if (!editForm.department) {
      setEditMsg('Department is required');
      return;
    }
    const gradeVal = editForm.grade === '__other__' ? customEditGrade.trim() : editForm.grade.trim();
    if (!gradeVal) {
      setEditMsg('Grade is required');
      return;
    }
    const isLeader = LEADER_GRADES.includes(gradeVal.toLowerCase());
    const isPromotedEditAccess = editForm.akses === 'admin_hr' || editForm.akses === 'admin_ops';
    const roleVal = isLeader ? 'Partner' : isPromotedEditAccess ? ACCESS_LABELS[editForm.akses] : editForm.roleLabel.trim();
    if (!roleVal) {
      setEditMsg('Role is required');
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
          akses: editForm.akses,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEditMsg(data?.error || 'Failed to save changes');
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
      setEditMsg('A network error occurred');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteModal) return;
    setDeletingUser(true);
    try {
      const res = await fetch(`/api/hr/talent-roster/${deleteModal.idKaryawan}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        setStatus({ ok: false, text: data?.error || 'Failed to delete employee' });
        return;
      }
      const res2 = await fetch('/api/hr/talent-roster', { cache: 'no-store' });
      if (res2.ok) {
        const d2 = await res2.json();
        setEmployees((d2.list ?? []) as Employee[]);
      }
      const deletedName = deleteModal.nama;
      setDeleteModal(null);
      setStatus({ ok: true, text: `Employee "${deletedName}" successfully deleted.` });
    } catch {
      setStatus({ ok: false, text: 'A network error occurred' });
    } finally {
      setDeletingUser(false);
    }
  };

  const departmentLabel = (d: string) => DEPARTMENT_LABELS[d] || d || '-';
  const contractLabel = (t?: string) => (t === 'TETAP' ? 'Permanent' : 'Contract');

  const rosterColumns: DataTableColumn<RosterRow>[] = [
    { key: 'nama', label: 'Name' },
    { key: 'department', label: 'Department', render: (e) => departmentLabel(e.department) },
    { key: 'grade', label: 'Grade' },
    { key: 'roleLabel', label: 'Role' },
    { key: 'tipeKontrak', label: 'Contract Type', render: (e) => contractLabel(e.tipeKontrak) },
    {
      key: 'id',
      label: 'Assessment',
      render: (e) => <AssessmentBadge done={!!e.assessment} fullWidth />,
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

  const isSelfEdit = !!myEmail && editModal?.email === myEmail;

  if (loading) return <TableSkeleton columns={8} />;

  return (
    <>
      <div className="w-full h-full flex flex-col gap-3">
        <PageTopBar showGreeting />

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

        <SectionCard
          title="Talent Management"
          subtitle={`${rosterRows.length} employee(s)`}
          scroll
          action={
            <Button variant="primary" size="md" onClick={() => { setIsAddUserOpen(true); setAddUserMsg(''); }}>
              Add New Talent
            </Button>
          }
        >
          <DataTable key="roster" columns={rosterColumns} rows={rosterRows} defaultSortKey="nama" emptyMessage="Tidak ada karyawan." compact />
        </SectionCard>
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
            certificates: detailsModal.certificates.map((c) => ({ title: c.judul, fileURL: c.fileURL })),
          }}
          onClose={() => setDetailsModal(null)}
          onViewAssessment={() => setAssessmentModal(detailsModal)}
          onViewCertificate={(cert) => cert.fileURL && setPreviewPdf({ title: cert.title, url: cert.fileURL })}
          onViewCareerHistory={() => openCareerHistory(detailsModal)}
        />
      )}

      {careerHistoryModal && (
        <CareerHistoryModal
          employeeName={careerHistoryModal.nama}
          history={careerHistory}
          loading={loadingHistory}
          onClose={() => setCareerHistoryModal(null)}
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

      <PdfPreviewModal target={previewPdf} onClose={() => setPreviewPdf(null)} />

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
                value={isLeaderGrade ? 'Partner' : isPromotedAccess ? ACCESS_LABELS[newUser.akses] : newUser.namaRole}
                onChange={(v) => setNewUser((p) => ({ ...p, namaRole: v }))}
                disabled={isLeaderGrade || isPromotedAccess}
                placeholder="e.g.: Software Engineer, Data Analyst"
              />
              {isLeaderGrade && <p className="pt-1.5 text-[12px] text-amana-neutral-400">Grade Head/Partner automatically becomes role Partner.</p>}
            </div>

            <div>
              <SelectField
                label="Access"
                value={newUser.akses}
                onChange={(v) => setNewUser((p) => ({ ...p, akses: v }))}
                options={ACCESS_OPTIONS}
                labels={ACCESS_LABELS}
                disabled={isLeaderGrade}
                placeholder="Choose Access"
              />
              {isLeaderGrade && <p className="pt-1.5 text-[12px] text-amana-neutral-400">Grade Head/Partner automatically becomes access Partner.</p>}
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
            <Button variant="outline" size="lg" onClick={() => { setIsAddUserOpen(false); setAddUserMsg(''); setCustomGrade(''); }}>
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
          {isSelfEdit && (
            <div className="mx-5 mt-4 flex-shrink-0 flex items-center gap-2 rounded-[5px] border border-amana-danger-500 bg-amana-danger-100 px-4 py-2.5 text-[14px] font-medium text-amana-danger-500">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              You can&apos;t edit your own account.
            </div>
          )}
          <div className="flex-1 min-h-0 overflow-y-auto scroll-smooth p-5 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <SelectField
              label="Department"
              value={editForm.department}
              onChange={(v) => setEditForm((p) => ({ ...p, department: v, grade: '' }))}
              options={DEPARTMENT_OPTION_LIST}
              labels={DEPARTMENT_LABELS}
              disabled={isSelfEdit}
              placeholder="Choose Department"
            />

            <div>
              <SelectField
                label="Grade"
                value={editForm.grade === '__other__' ? '__other__' : editForm.grade}
                onChange={(v) => setEditForm((p) => ({ ...p, grade: v }))}
                options={[...(editForm.department === 'ops' ? OPS_GRADES : editForm.department ? NON_OPS_GRADES : []), '__other__']}
                labels={{ __other__: 'Other / Custom' }}
                disabled={!editForm.department || isSelfEdit}
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
                value={
                  LEADER_GRADES.includes((editForm.grade === '__other__' ? customEditGrade : editForm.grade).toLowerCase())
                    ? 'Partner'
                    : editForm.akses === 'admin_hr' || editForm.akses === 'admin_ops'
                      ? ACCESS_LABELS[editForm.akses]
                      : editForm.roleLabel
                }
                onChange={(v) => setEditForm((p) => ({ ...p, roleLabel: v }))}
                disabled={
                  isSelfEdit ||
                  LEADER_GRADES.includes((editForm.grade === '__other__' ? customEditGrade : editForm.grade).toLowerCase()) ||
                  editForm.akses === 'admin_hr' ||
                  editForm.akses === 'admin_ops'
                }
                placeholder="e.g.: Software Engineer, Data Analyst"
              />
              {LEADER_GRADES.includes((editForm.grade === '__other__' ? customEditGrade : editForm.grade).toLowerCase()) && (
                <p className="pt-1.5 text-[12px] text-amana-neutral-400">Grade Head/Partner automatically becomes role Partner.</p>
              )}
            </div>

            <div>
              <SelectField
                label="Access"
                value={editForm.akses}
                onChange={(v) => setEditForm((p) => ({ ...p, akses: v }))}
                options={ACCESS_OPTIONS}
                labels={ACCESS_LABELS}
                disabled={isSelfEdit || LEADER_GRADES.includes((editForm.grade === '__other__' ? customEditGrade : editForm.grade).toLowerCase())}
                placeholder="Choose Access"
              />
              {LEADER_GRADES.includes((editForm.grade === '__other__' ? customEditGrade : editForm.grade).toLowerCase()) && (
                <p className="pt-1.5 text-[12px] text-amana-neutral-400">Grade Head/Partner automatically becomes access Partner.</p>
              )}
            </div>
          </div>

          {editMsg && (
            <p className="px-5 pb-1 text-[13px] font-medium text-amana-danger-500">{editMsg}</p>
          )}

          <div className="flex-shrink-0 flex items-center justify-between gap-3 px-5 py-4 border-t border-amana-neutral-200">
            <Button
              variant="danger"
              size="lg"
              disabled={isSelfEdit}
              onClick={() => {
                setDeleteModal(editModal);
                setEditModal(null);
              }}
            >
              Delete
            </Button>
            <div className="flex gap-3">
              <Button variant="outline" size="lg" onClick={() => { setEditModal(null); setEditMsg(''); setCustomEditGrade(''); }}>
                Cancel
              </Button>
              <Button variant="primary" size="lg" disabled={savingEdit || isSelfEdit} onClick={handleSaveEdit}>
                {savingEdit ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {deleteModal && (
        <Modal title={`Delete Employee - ${deleteModal.nama || ''}`} onClose={() => setDeleteModal(null)} maxWidth="max-w-md">
          <div className="p-5 flex flex-col gap-4">
            <p className="text-sm text-amana-neutral-400">
              Are you sure you want to delete <span className="font-semibold text-amana-neutral-500">{deleteModal.nama}</span>?
              Employee data along with all their records will be permanently deleted and cannot be recovered.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" size="lg" onClick={() => setDeleteModal(null)}>Cancel</Button>
              <Button variant="danger" size="lg" disabled={deletingUser} onClick={handleDeleteUser}>
                {deletingUser ? 'Processing...' : 'Delete'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      <StatusModal state={status} onClose={() => setStatus(null)} />
    </>
  );
}
