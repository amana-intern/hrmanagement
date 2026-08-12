'use client';

import { useEffect, useState } from 'react';
import { Button, Modal, Table, Badge, Input, Select, Label } from '../ui';
import SuccessModal from '../ui/SuccessModal';
import { ASSESSMENT_LEVELS, ASSESSMENT_FIELDS } from '@/lib/assessment-template';
import { ASSESSMENT_STATUS } from '@/lib/constants';

interface Question {
  idPertanyaan: string;
  teks: string;
}

interface Category {
  idKategoriAsm: string;
  namaKategori: string;
  questions: Question[];
}

interface Assessment {
  idAssessment: string;
  judul: string;
  deskripsi: string | null;
  idStatus: string;
  statusLabel: string;
  tanggalBuka: string | null;
  tanggalTutup: string | null;
  totalPeserta: number;
  categories: Category[];
}

type DraftQuestion = { teks: string };
type DraftCategory = { namaKategori: string; questions: DraftQuestion[] };

function statusVariant(s: string) {
  return s === ASSESSMENT_STATUS.OPEN ? 'success' : 'default';
}

// Kelola assessment (daftar, buat, buka/tutup, detail). Dipakai di dalam Talent Roster.
async function fetchAssessments(): Promise<Assessment[]> {
  const res = await fetch('/api/hr/assessments', { cache: 'no-store' });
  if (!res.ok) throw new Error('Gagal memuat assessment');
  return (await res.json()).list ?? [];
}

export default function AssessmentManager() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [judul, setJudul] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [tanggalBuka, setTanggalBuka] = useState('');
  const [tanggalTutup, setTanggalTutup] = useState('');
  const [openOnCreate, setOpenOnCreate] = useState(true);
  const [draftCategories, setDraftCategories] = useState<DraftCategory[]>([]);
  const [viewAssessment, setViewAssessment] = useState<Assessment | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setAssessments(await fetchAssessments());
        setError('');
      } catch {
        setError('Gagal memuat assessment');
      }
      setLoading(false);
    })();
  }, []);

  const load = async () => {
    try {
      setAssessments(await fetchAssessments());
      setError('');
    } catch {
      setError('Gagal memuat assessment');
    }
  };

  const openCreateModal = () => {
    setJudul('');
    setDeskripsi('');
    setTanggalBuka('');
    setTanggalTutup('');
    setOpenOnCreate(true);
    setDraftCategories(
      ASSESSMENT_FIELDS.map((f) => ({
        namaKategori: f.namaKategori,
        questions: f.kompetensi.map((k) => ({ teks: k })),
      }))
    );
    setCreateOpen(true);
  };

  const handleToggle = async (a: Assessment) => {
    setProcessing(true);
    const open = a.idStatus !== ASSESSMENT_STATUS.OPEN;
    const res = await fetch(`/api/hr/assessments/${a.idAssessment}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ open }),
    });
    if (res.ok) {
      await load();
      setSuccessMsg(`Assessment "${a.judul}" berhasil di${open ? 'buka' : 'tutup'}`);
    } else {
      const d = await res.json().catch(() => null);
      alert(d?.error || 'Gagal mengubah status');
    }
    setProcessing(false);
  };

  const handleCreate = async () => {
    if (!judul.trim()) return alert('Judul wajib diisi');
    const cats = draftCategories
      .filter((c) => c.namaKategori.trim() !== '')
      .map((c) => ({
        namaKategori: c.namaKategori,
        questions: c.questions.filter((q) => q.teks.trim() !== ''),
      }));
    if (cats.length === 0) return alert('Minimal 1 kategori bidang');

    setProcessing(true);
    const res = await fetch('/api/hr/assessments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        judul,
        deskripsi,
        tanggalBuka: tanggalBuka || undefined,
        tanggalTutup: tanggalTutup || undefined,
        categories: cats,
        open: openOnCreate,
      }),
    });
    const d = await res.json().catch(() => null);
    setProcessing(false);
    if (!res.ok) return alert(d?.error || 'Gagal membuat assessment');

    setCreateOpen(false);
    await load();
    setSuccessMsg(`Assessment "${judul}" berhasil dibuat`);
  };

  const updateCategory = (idx: number, field: keyof DraftCategory, value: string | DraftQuestion[]) => {
    setDraftCategories((prev) => prev.map((c, i) => (i === idx ? { ...c, [field]: value } : c)));
  };

  const columns = [
    { key: 'judul', label: 'Judul' },
    { key: 'status', label: 'Status', align: 'center' as const },
    { key: 'periode', label: 'Periode' },
    { key: 'peserta', label: 'Peserta', align: 'center' as const },
    { key: 'action', label: 'Action', align: 'center' as const },
  ];

  if (loading) return <div className="py-10 text-center">Loading...</div>;

  return (
    <>
      <div className="flex items-center justify-between mb-4 animate-fade-down">
        <h2 className="text-xl font-bold text-amana-primary-500">Kelola Competency Assessment</h2>
        <Button variant="primary" onClick={openCreateModal}>+ Create Assessment</Button>
      </div>

      {error && <p className="text-sm text-rose-600 mb-4">{error}</p>}

      <div className="animate-slide-up delay-100">
        <Table columns={columns}>
          {assessments.map((a) => (
            <tr key={a.idAssessment} className="hover:bg-amana-primary-500/[0.03] transition-colors duration-200">
            <td className="p-4 font-semibold text-amana-neutral-500">
              <button onClick={() => setViewAssessment(a)} className="hover:text-amana-primary-500 transition-colors text-left">
                {a.judul}
              </button>
            </td>
            <td className="p-4 text-center">
              <Badge variant={statusVariant(a.idStatus)}>{a.statusLabel}</Badge>
            </td>
            <td className="p-4 text-amana-neutral-400 text-xs">
              {a.tanggalBuka ? new Date(a.tanggalBuka).toLocaleDateString('id-ID') : '-'}
              {a.tanggalTutup ? ` — ${new Date(a.tanggalTutup).toLocaleDateString('id-ID')}` : ''}
            </td>
            <td className="p-4 text-center text-amana-neutral-500 font-semibold">{a.totalPeserta}</td>
            <td className="p-4 text-center">
              <Button
                variant={a.idStatus === ASSESSMENT_STATUS.OPEN ? 'secondary' : 'primary'}
                disabled={processing}
                onClick={() => handleToggle(a)}
              >
                {a.idStatus === ASSESSMENT_STATUS.OPEN ? 'Tutup' : 'Buka'}
              </Button>
            </td>
          </tr>
        ))}
        {assessments.length === 0 && (
          <tr>
            <td colSpan={5} className="p-6 text-center text-amana-neutral-400 text-sm">
              Belum ada assessment. Klik &quot;Buat Assessment&quot; untuk membuat.
            </td>
          </tr>
        )}
      </Table>
      </div>

      {/* Modal buat assessment */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Assessment">
        <div className="space-y-4">
          <div>
            <Label>Judul</Label>
            <Input value={judul} onChange={(e) => setJudul(e.target.value)} placeholder="Contoh: Competency Assessment 2026" />
          </div>
          <div>
            <Label>Deskripsi (opsional)</Label>
            <Input value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} placeholder="Deskripsi singkat" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tanggal Buka</Label>
              <Input type="date" value={tanggalBuka} onChange={(e) => setTanggalBuka(e.target.value)} />
            </div>
            <div>
              <Label>Tanggal Tutup</Label>
              <Input type="date" value={tanggalTutup} onChange={(e) => setTanggalTutup(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Status saat dibuat</Label>
            <Select value={openOnCreate ? 'open' : 'closed'} onChange={(e) => setOpenOnCreate(e.target.value === 'open')}>
              <option value="open">Langsung Buka</option>
              <option value="closed">Tutup (draft)</option>
            </Select>
          </div>

          <div className="border-t border-amana-neutral-200 pt-4">
            <div className="flex items-center justify-between mb-2">
              <Label className="mb-0">Bidang & Kompetensi</Label>
              <button
                onClick={() => setDraftCategories((p) => [...p, { namaKategori: '', questions: [{ teks: '' }] }])}
                className="text-xs font-semibold text-amana-primary-500 hover:underline bg-transparent border-none cursor-pointer"
              >
                + Tambah Bidang
              </button>
            </div>

            {draftCategories.map((cat, ci) => (
              <div key={ci} className="p-3 rounded-xl border border-amana-neutral-200 mb-3 bg-amana-neutral-100">
                <div className="flex gap-2 items-center mb-2">
                  <Input
                    value={cat.namaKategori}
                    onChange={(e) => updateCategory(ci, 'namaKategori', e.target.value)}
                    placeholder="Nama Bidang"
                    className="flex-1"
                  />
                  <Button variant="ghost" onClick={() => setDraftCategories((p) => p.filter((_, i) => i !== ci))}>Hapus</Button>
                </div>
                {cat.questions.map((q, qi) => (
                  <div key={qi} className="flex gap-2 items-center mb-1.5">
                    <Input
                      value={q.teks}
                      onChange={(e) =>
                        setDraftCategories((prev) =>
                          prev.map((c, i) =>
                            i === ci
                              ? { ...c, questions: c.questions.map((x, j) => (j === qi ? { teks: e.target.value } : x)) }
                              : c
                          )
                        )
                      }
                      placeholder="Kompetensi (pertanyaan)"
                      className="flex-1"
                    />
                    <button
                      onClick={() =>
                        setDraftCategories((prev) =>
                          prev.map((c, i) => (i === ci ? { ...c, questions: c.questions.filter((_, j) => j !== qi) } : c))
                        )
                      }
                      className="text-amana-neutral-400 hover:text-rose-500 bg-transparent border-none cursor-pointer"
                      aria-label="Hapus kompetensi"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                <button
                  onClick={() =>
                    setDraftCategories((prev) =>
                      prev.map((c, i) => (i === ci ? { ...c, questions: [...c.questions, { teks: '' }] } : c))
                    )
                  }
                  className="text-xs font-semibold text-amana-primary-500 hover:underline bg-transparent border-none cursor-pointer mt-1"
                >
                  + Tambah Kompetensi
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button variant="primary" disabled={processing} onClick={handleCreate}>
              {processing ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal detail assessment */}
      <Modal open={!!viewAssessment} onClose={() => setViewAssessment(null)} title={viewAssessment?.judul ?? ''}>
        {viewAssessment && (
          <div className="space-y-3">
            <p className="text-sm text-amana-neutral-400">{viewAssessment.deskripsi ?? '-'}</p>
            <div className="flex gap-2 items-center">
              <Badge variant={statusVariant(viewAssessment.idStatus)}>{viewAssessment.statusLabel}</Badge>
              <span className="text-xs text-amana-neutral-400">
                {viewAssessment.totalPeserta} peserta ·{' '}
                {viewAssessment.categories.length} bidang
              </span>
            </div>
            {viewAssessment.categories.map((cat) => (
              <div key={cat.idKategoriAsm} className="p-3 rounded-xl bg-amana-neutral-200/40 border border-amana-neutral-200">
                <p className="font-semibold text-sm text-amana-neutral-500 mb-2">{cat.namaKategori}</p>
                <div className="flex flex-wrap gap-1.5">
                  {cat.questions.map((q) => (
                    <span key={q.idPertanyaan} className="text-xs px-2 py-1 rounded-lg bg-white border border-amana-neutral-200 text-amana-neutral-400">
                      {q.teks}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            <div className="p-3 rounded-xl bg-amana-primary-200/10 border border-amana-neutral-200">
              <p className="text-xs font-semibold text-amana-neutral-400 mb-1">Tingkat kemahiran</p>
              <div className="space-y-0.5">
                {ASSESSMENT_LEVELS.map((l) => (
                  <p key={l.level} className="text-xs text-amana-neutral-400">
                    Level {l.level} ({l.label}): {l.description}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <SuccessModal
        open={!!successMsg}
        onClose={() => setSuccessMsg(null)}
        message={successMsg ?? undefined}
      />
    </>
  );
}