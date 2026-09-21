'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { durationFast, easeOut } from '@/app/utils/motion';
import { X } from 'lucide-react';
import PageTopBar from '@/app/components/layout/PageTopBar';
import Button from '@/app/components/forms/Button';
import TextField from '@/app/components/forms/TextField';
import SelectField from '@/app/components/forms/SelectField';
import Modal from '@/app/components/feedback/Modal';
import ConfirmModal from '@/app/components/feedback/ConfirmModal';
import StatusModal from '@/app/components/feedback/StatusModal';
import SectionCard from '@/app/components/layout/SectionCard';
import DataTable from '@/app/components/data-display/DataTable';
import { TableSkeleton } from '@/app/components/feedback/PageSkeleton';
import type { DataTableColumn } from '@/app/components/data-display/DataTable';
import StatusPill from '@/app/components/data-display/StatusPill';
import { ASSESSMENT_STATUS, ASSESSMENT_QUESTION_TYPES, ASSESSMENT_QUESTION_TYPE_LABELS } from '@/lib/constants';
import { formatDateWIB } from '@/app/utils/formatDate';

type QuestionType = (typeof ASSESSMENT_QUESTION_TYPES)[keyof typeof ASSESSMENT_QUESTION_TYPES];
const QUESTION_TYPE_VALUES = Object.values(ASSESSMENT_QUESTION_TYPES);

interface Option {
  idOpsi: string;
  teks: string;
}

interface Question {
  idPertanyaan: string;
  teks: string;
  tipeSoal: string | null;
  gridId: string | null;
  options: Option[];
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

type AssessmentRow = Assessment & { id: string };

type DraftOption = { id: string; teks: string };
type DraftQuestion = { id: string; teks: string; tipeSoal: QuestionType; options: DraftOption[]; rows?: DraftOption[] };
type DraftCategory = { id: string; namaKategori: string; questions: DraftQuestion[] };

function blankOption(): DraftOption {
  return { id: crypto.randomUUID(), teks: '' };
}

function blankQuestion(): DraftQuestion {
  return {
    id: crypto.randomUUID(),
    teks: '',
    tipeSoal: ASSESSMENT_QUESTION_TYPES.MULTIPLE_CHOICE,
    options: [blankOption(), blankOption()],
  };
}

function blankCategory(): DraftCategory {
  return { id: crypto.randomUUID(), namaKategori: '', questions: [blankQuestion()] };
}

// Regroups a category's flat, urutan-ordered question list back into draft questions —
// consecutive checkbox_grid rows sharing the same gridId collapse into one grid DraftQuestion.
function buildDraftQuestions(questions: Question[]): DraftQuestion[] {
  const result: DraftQuestion[] = [];
  let openGridId: string | null = null;
  for (const q of questions) {
    if (q.tipeSoal === ASSESSMENT_QUESTION_TYPES.CHECKBOX_GRID && q.gridId) {
      if (q.gridId === openGridId) {
        result[result.length - 1].rows!.push({ id: crypto.randomUUID(), teks: q.teks });
        continue;
      }
      openGridId = q.gridId;
      result.push({
        id: crypto.randomUUID(),
        teks: '',
        tipeSoal: ASSESSMENT_QUESTION_TYPES.CHECKBOX_GRID,
        options: q.options.length > 0 ? q.options.map((o) => ({ id: crypto.randomUUID(), teks: o.teks })) : [blankOption(), blankOption()],
        rows: [{ id: crypto.randomUUID(), teks: q.teks }],
      });
      continue;
    }
    openGridId = null;
    result.push({
      id: crypto.randomUUID(),
      teks: q.teks,
      tipeSoal: (q.tipeSoal as QuestionType) || ASSESSMENT_QUESTION_TYPES.MULTIPLE_CHOICE,
      options: q.options.length > 0 ? q.options.map((o) => ({ id: crypto.randomUUID(), teks: o.teks })) : [blankOption(), blankOption()],
    });
  }
  return result;
}

function statusColorFor(idStatus: string) {
  return idStatus === ASSESSMENT_STATUS.OPEN ? 'bg-amana-success-500' : 'bg-amana-neutral-400';
}

async function fetchAssessments(): Promise<Assessment[]> {
  const res = await fetch('/api/hr/assessments', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load assessments');
  return (await res.json()).list ?? [];
}

export default function ManageAssessmentPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);
  const [judul, setJudul] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [draftCategories, setDraftCategories] = useState<DraftCategory[]>([]);
  const [viewAssessment, setViewAssessment] = useState<Assessment | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<Assessment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Assessment | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setAssessments(await fetchAssessments());
      } catch {
        setStatus({ ok: false, text: 'Failed to load assessments' });
      }
      setLoading(false);
    })();
  }, []);

  const load = async () => {
    try {
      setAssessments(await fetchAssessments());
    } catch {
      setStatus({ ok: false, text: 'Failed to load assessments' });
    }
  };

  const openCreateForm = () => {
    setEditingAssessment(null);
    setJudul('');
    setDeskripsi('');
    setStartDate('');
    setEndDate('');
    setDraftCategories([blankCategory()]);
    setCreateOpen(true);
  };

  const openEditForm = (a: Assessment) => {
    setEditingAssessment(a);
    setJudul(a.judul);
    setDeskripsi(a.deskripsi ?? '');
    setStartDate(a.tanggalBuka ? a.tanggalBuka.slice(0, 10) : '');
    setEndDate(a.tanggalTutup ? a.tanggalTutup.slice(0, 10) : '');
    const categories: DraftCategory[] = a.categories.map((c) => ({
      id: crypto.randomUUID(),
      namaKategori: c.namaKategori,
      questions: c.questions.length > 0 ? buildDraftQuestions(c.questions) : [blankQuestion()],
    }));
    setDraftCategories(categories.length > 0 ? categories : [blankCategory()]);
    setViewAssessment(null);
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
      setStatus({ ok: true, text: `Assessment "${a.judul}" successfully ${open ? 'opened' : 'closed'}.` });
    } else {
      const d = await res.json().catch(() => null);
      setStatus({ ok: false, text: d?.error || 'Failed to update status' });
    }
    setProcessing(false);
  };

  const handleSave = async () => {
    if (!judul.trim()) {
      setStatus({ ok: false, text: 'Title is required' });
      return;
    }
    const categoriesWithQuestions = draftCategories
      .map((cat) => ({
        ...cat,
        questions: cat.questions.filter((q) => q.teks.trim() !== '' || q.tipeSoal === ASSESSMENT_QUESTION_TYPES.CHECKBOX_GRID),
      }))
      .filter((cat) => cat.questions.length > 0);

    const allQuestions = categoriesWithQuestions.flatMap((cat) => cat.questions);
    if (allQuestions.length === 0) {
      setStatus({ ok: false, text: 'At least 1 question is required' });
      return;
    }
    const missingOptions = allQuestions.some(
      (q) =>
        q.tipeSoal !== ASSESSMENT_QUESTION_TYPES.SHORT_ANSWER &&
        q.options.filter((o) => o.teks.trim() !== '').length < 2
    );
    if (missingOptions) {
      setStatus({ ok: false, text: 'Multiple choice / checkbox questions need at least 2 options' });
      return;
    }
    const missingRows = allQuestions.some(
      (q) => q.tipeSoal === ASSESSMENT_QUESTION_TYPES.CHECKBOX_GRID && (q.rows ?? []).filter((r) => r.teks.trim() !== '').length < 1
    );
    if (missingRows) {
      setStatus({ ok: false, text: 'Checkbox grid questions need at least 1 row' });
      return;
    }
    if (startDate && endDate && endDate < startDate) {
      setStatus({ ok: false, text: 'End date must be after start date' });
      return;
    }

    setProcessing(true);
    const payload = {
      judul,
      deskripsi,
      categories: categoriesWithQuestions.map((cat) => ({
        namaKategori: cat.namaKategori.trim() || judul,
        questions: cat.questions.map((q) => ({
          teks: q.tipeSoal === ASSESSMENT_QUESTION_TYPES.CHECKBOX_GRID ? undefined : q.teks,
          tipeSoal: q.tipeSoal,
          options:
            q.tipeSoal === ASSESSMENT_QUESTION_TYPES.SHORT_ANSWER
              ? []
              : q.options.filter((o) => o.teks.trim() !== ''),
          rows:
            q.tipeSoal === ASSESSMENT_QUESTION_TYPES.CHECKBOX_GRID
              ? (q.rows ?? []).filter((r) => r.teks.trim() !== '')
              : undefined,
        })),
      })),
      startDate: startDate || null,
      endDate: endDate || null,
    };
    const res = editingAssessment
      ? await fetch(`/api/hr/assessments/${editingAssessment.idAssessment}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      : await fetch('/api/hr/assessments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
    const d = await res.json().catch(() => null);
    setProcessing(false);
    if (!res.ok) {
      setStatus({ ok: false, text: d?.error || `Failed to ${editingAssessment ? 'update' : 'create'} assessment` });
      return;
    }

    setCreateOpen(false);
    setEditingAssessment(null);
    await load();
    setStatus({ ok: true, text: `Assessment "${judul}" successfully ${editingAssessment ? 'updated' : 'created'}.` });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await fetch(`/api/hr/assessments/${deleteTarget.idAssessment}`, { method: 'DELETE' });
    const d = await res.json().catch(() => null);
    setDeleting(false);
    if (!res.ok) {
      setStatus({ ok: false, text: d?.error || 'Failed to delete assessment' });
      return;
    }
    const deletedTitle = deleteTarget.judul;
    setDeleteTarget(null);
    await load();
    setStatus({ ok: true, text: `Assessment "${deletedTitle}" successfully deleted.` });
  };

  const updateQuestion = (ci: number, qi: number, patch: Partial<DraftQuestion>) => {
    setDraftCategories((prev) =>
      prev.map((cat, i) =>
        i !== ci ? cat : { ...cat, questions: cat.questions.map((q, j) => (j === qi ? { ...q, ...patch } : q)) }
      )
    );
  };

  const changeQuestionType = (ci: number, qi: number, tipeSoal: QuestionType) => {
    setDraftCategories((prev) =>
      prev.map((cat, i) => {
        if (i !== ci) return cat;
        return {
          ...cat,
          questions: cat.questions.map((q, j) => {
            if (j !== qi) return q;
            const options =
              tipeSoal !== ASSESSMENT_QUESTION_TYPES.SHORT_ANSWER && q.options.length === 0
                ? [blankOption(), blankOption()]
                : q.options;
            const rows =
              tipeSoal === ASSESSMENT_QUESTION_TYPES.CHECKBOX_GRID && (q.rows ?? []).length === 0
                ? [blankOption(), blankOption()]
                : q.rows;
            return { ...q, tipeSoal, options, rows };
          }),
        };
      })
    );
  };

  const updateOption = (ci: number, qi: number, oi: number, teks: string) => {
    setDraftCategories((prev) =>
      prev.map((cat, i) => {
        if (i !== ci) return cat;
        return {
          ...cat,
          questions: cat.questions.map((q, j) =>
            j === qi ? { ...q, options: q.options.map((o, k) => (k === oi ? { ...o, teks } : o)) } : q
          ),
        };
      })
    );
  };

  const addOption = (ci: number, qi: number) => {
    setDraftCategories((prev) =>
      prev.map((cat, i) =>
        i !== ci
          ? cat
          : { ...cat, questions: cat.questions.map((q, j) => (j === qi ? { ...q, options: [...q.options, blankOption()] } : q)) }
      )
    );
  };

  const removeOption = (ci: number, qi: number, oi: number) => {
    setDraftCategories((prev) =>
      prev.map((cat, i) => {
        if (i !== ci) return cat;
        return { ...cat, questions: cat.questions.map((q, j) => (j === qi ? { ...q, options: q.options.filter((_, k) => k !== oi) } : q)) };
      })
    );
  };

  const updateRow = (ci: number, qi: number, ri: number, teks: string) => {
    setDraftCategories((prev) =>
      prev.map((cat, i) => {
        if (i !== ci) return cat;
        return {
          ...cat,
          questions: cat.questions.map((q, j) =>
            j === qi ? { ...q, rows: (q.rows ?? []).map((r, k) => (k === ri ? { ...r, teks } : r)) } : q
          ),
        };
      })
    );
  };

  const addRow = (ci: number, qi: number) => {
    setDraftCategories((prev) =>
      prev.map((cat, i) =>
        i !== ci
          ? cat
          : { ...cat, questions: cat.questions.map((q, j) => (j === qi ? { ...q, rows: [...(q.rows ?? []), blankOption()] } : q)) }
      )
    );
  };

  const removeRow = (ci: number, qi: number, ri: number) => {
    setDraftCategories((prev) =>
      prev.map((cat, i) => {
        if (i !== ci) return cat;
        return { ...cat, questions: cat.questions.map((q, j) => (j === qi ? { ...q, rows: (q.rows ?? []).filter((_, k) => k !== ri) } : q)) };
      })
    );
  };

  const updateCategoryName = (ci: number, namaKategori: string) => {
    setDraftCategories((prev) => prev.map((cat, i) => (i === ci ? { ...cat, namaKategori } : cat)));
  };

  const addQuestion = (ci: number) => {
    setDraftCategories((prev) => prev.map((cat, i) => (i === ci ? { ...cat, questions: [...cat.questions, blankQuestion()] } : cat)));
  };

  const removeQuestion = (ci: number, qi: number) => {
    setDraftCategories((prev) => prev.map((cat, i) => (i === ci ? { ...cat, questions: cat.questions.filter((_, j) => j !== qi) } : cat)));
  };

  const addCategory = () => {
    setDraftCategories((prev) => [...prev, blankCategory()]);
  };

  const removeCategory = (ci: number) => {
    setDraftCategories((prev) => prev.filter((_, i) => i !== ci));
  };

  const rows: AssessmentRow[] = assessments.map((a) => ({ ...a, id: a.idAssessment }));

  const columns: DataTableColumn<AssessmentRow>[] = [
    {
      key: 'judul',
      label: 'Title',
      width: '22%',
      minPx: 220,
      render: (a) => (
        <button onClick={() => setViewAssessment(a)} className="hover:text-amana-primary-500 transition-colors font-semibold">
          {a.judul}
        </button>
      ),
    },
    {
      key: 'statusLabel',
      label: 'Status',
      width: '13%',
      minPx: 130,
      render: (a) => <StatusPill color={statusColorFor(a.idStatus)}>{a.statusLabel}</StatusPill>,
    },
    {
      key: 'tanggalBuka',
      label: 'Period',
      width: '28%',
      minPx: 280,
      render: (a) => (
        <span className="text-[14px] leading-tight">
          {a.tanggalBuka ? formatDateWIB(a.tanggalBuka) : '-'}
          {a.tanggalTutup ? ` – ${formatDateWIB(a.tanggalTutup)}` : ''}
        </span>
      ),
    },
    { key: 'totalPeserta', label: 'Participants', width: '12%', minPx: 120 },
    {
      key: 'id',
      label: 'Action',
      width: '25%',
      minPx: 240,
      render: (a) => (
        <div className="flex gap-2">
          <Button
            variant={a.idStatus === ASSESSMENT_STATUS.OPEN ? 'outline' : 'primary'}
            size="sm"
            className="flex-1"
            disabled={processing}
            onClick={() => setConfirmTarget(a)}
          >
            {a.idStatus === ASSESSMENT_STATUS.OPEN ? 'Close' : 'Open'}
          </Button>
          <Button variant="outline" size="sm" className="flex-1" onClick={() => setViewAssessment(a)}>
            View
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full h-full flex flex-col gap-3">
      <PageTopBar showGreeting />

      {loading ? (
        <TableSkeleton columns={4} rows={3} topBar={false} />
      ) : createOpen ? (
        <SectionCard
          title={editingAssessment ? `Edit Assessment - ${editingAssessment.judul}` : 'Create Assessment'}
          scroll
          className="flex-1"
        >
          <div className="flex-1 min-h-0 overflow-y-auto scroll-smooth flex flex-col gap-4 pt-1">
            <TextField label="Assessment Title" value={judul} onChange={setJudul} placeholder="Assessment Title" />
            <TextField label="Assessment Description" value={deskripsi} onChange={setDeskripsi} placeholder="Short description" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <TextField label="Start Date (optional)" type="date" value={startDate} onChange={setStartDate} />
              <TextField label="End Date (optional)" type="date" value={endDate} onChange={setEndDate} />
            </div>
            <p className="text-[13px] text-amana-neutral-400 -mt-2">
              Leave both empty to open immediately with no auto-close. If set, the assessment opens automatically on the start date and closes automatically on the end date.
            </p>

            <motion.div layout transition={{ duration: durationFast, ease: easeOut }} className="border-t border-amana-neutral-200 pt-4">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[16px] font-semibold text-amana-neutral-500">Sections</label>
                <Button variant="outline" size="sm" onClick={addCategory}>
                  Add Section
                </Button>
              </div>
              <p className="text-[13px] text-amana-neutral-400 mb-2">
                Leave a section name empty to default it to the assessment title.
              </p>

              <AnimatePresence initial={false}>
                {draftCategories.map((cat, ci) => (
                  <motion.div
                    key={cat.id}
                    layout
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: durationFast, ease: easeOut }}
                    className="overflow-hidden"
                  >
                    <div className="p-3 rounded-[5px] bg-amana-neutral-200/40 border border-amana-neutral-300 mb-4">
                      <div className="flex gap-2 items-end mb-3">
                        <div className="flex-1">
                          <TextField
                            value={cat.namaKategori}
                            onChange={(v) => updateCategoryName(ci, v)}
                            placeholder={`Section ${ci + 1} (e.g. Digital Transformation & GovTech)`}
                            label=""
                          />
                        </div>
                        <Button variant="danger" size="sm" onClick={() => removeCategory(ci)}>
                          Remove Section
                        </Button>
                      </div>

                      <AnimatePresence initial={false}>
                        {cat.questions.map((q, qi) => (
                          <motion.div
                            key={q.id}
                            layout
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: durationFast, ease: easeOut }}
                            className="overflow-hidden"
                          >
                            <div className="p-3 rounded-[5px] border border-amana-neutral-300 mb-3 bg-amana-neutral-100">
                              <div className="flex gap-2 items-end mb-2">
                                {q.tipeSoal !== ASSESSMENT_QUESTION_TYPES.CHECKBOX_GRID && (
                                  <div className="flex-1">
                                    <TextField value={q.teks} onChange={(v) => updateQuestion(ci, qi, { teks: v })} placeholder="Question" label="" />
                                  </div>
                                )}
                                <div className={q.tipeSoal === ASSESSMENT_QUESTION_TYPES.CHECKBOX_GRID ? 'flex-1' : 'w-[180px] flex-shrink-0'}>
                                  <SelectField
                                    value={q.tipeSoal}
                                    onChange={(v) => changeQuestionType(ci, qi, v as QuestionType)}
                                    options={QUESTION_TYPE_VALUES}
                                    labels={ASSESSMENT_QUESTION_TYPE_LABELS}
                                    label=""
                                  />
                                </div>
                              </div>

                              {(() => {
                                const optionsBlock = (
                                  <>
                                    <motion.div layout className="flex flex-col gap-1.5 mb-2">
                                      <AnimatePresence initial={false}>
                                        {q.options.map((o, oi) => (
                                          <motion.div
                                            key={o.id}
                                            layout
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: durationFast, ease: easeOut }}
                                            className="flex gap-2 items-center overflow-hidden"
                                          >
                                            {q.tipeSoal !== ASSESSMENT_QUESTION_TYPES.CHECKBOX_GRID && (
                                              <span
                                                className={
                                                  q.tipeSoal === ASSESSMENT_QUESTION_TYPES.CHECKBOX
                                                    ? 'w-4 h-4 flex-shrink-0 rounded-[4px] border border-amana-neutral-300'
                                                    : 'w-4 h-4 flex-shrink-0 rounded-full border border-amana-neutral-300'
                                                }
                                              />
                                            )}
                                            <div className="flex-1">
                                              <TextField value={o.teks} onChange={(v) => updateOption(ci, qi, oi, v)} placeholder={`Option ${oi + 1}`} label="" />
                                            </div>
                                            <button
                                              onClick={() => removeOption(ci, qi, oi)}
                                              className="text-amana-neutral-400 hover:text-amana-danger-500 bg-transparent border-none cursor-pointer"
                                              aria-label="Remove option"
                                            >
                                              <X className="w-4 h-4" />
                                            </button>
                                          </motion.div>
                                        ))}
                                      </AnimatePresence>
                                    </motion.div>
                                    {q.tipeSoal === ASSESSMENT_QUESTION_TYPES.CHECKBOX_GRID && (
                                      <Button variant="outline" size="sm" onClick={() => addOption(ci, qi)}>
                                        Add Column
                                      </Button>
                                    )}
                                  </>
                                );

                                if (q.tipeSoal === ASSESSMENT_QUESTION_TYPES.SHORT_ANSWER) {
                                  return (
                                    <p className="text-[14px] text-amana-neutral-300 italic border-b border-amana-neutral-300 pb-1.5 mb-2">
                                      Short answer text
                                    </p>
                                  );
                                }
                                if (q.tipeSoal === ASSESSMENT_QUESTION_TYPES.CHECKBOX_GRID) {
                                  return (
                                    <div className="grid grid-cols-2 gap-3 mb-2">
                                      <div>
                                        <p className="text-[13px] font-semibold text-amana-neutral-400 mb-1">Rows</p>
                                        <motion.div layout className="flex flex-col gap-1.5 mb-2">
                                          <AnimatePresence initial={false}>
                                            {(q.rows ?? []).map((r, ri) => (
                                              <motion.div
                                                key={r.id}
                                                layout
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: durationFast, ease: easeOut }}
                                                className="flex gap-2 items-center overflow-hidden"
                                              >
                                                <div className="flex-1">
                                                  <TextField value={r.teks} onChange={(v) => updateRow(ci, qi, ri, v)} placeholder={`Row ${ri + 1}`} label="" />
                                                </div>
                                                <button
                                                  onClick={() => removeRow(ci, qi, ri)}
                                                  className="text-amana-neutral-400 hover:text-amana-danger-500 bg-transparent border-none cursor-pointer"
                                                  aria-label="Remove row"
                                                >
                                                  <X className="w-4 h-4" />
                                                </button>
                                              </motion.div>
                                            ))}
                                          </AnimatePresence>
                                        </motion.div>
                                        <Button variant="outline" size="sm" onClick={() => addRow(ci, qi)}>
                                          Add Row
                                        </Button>
                                      </div>
                                      <div>
                                        <p className="text-[13px] font-semibold text-amana-neutral-400 mb-1">Columns</p>
                                        {optionsBlock}
                                      </div>
                                    </div>
                                  );
                                }
                                return optionsBlock;
                              })()}

                              <div className="flex items-center justify-between">
                                {q.tipeSoal === ASSESSMENT_QUESTION_TYPES.SHORT_ANSWER || q.tipeSoal === ASSESSMENT_QUESTION_TYPES.CHECKBOX_GRID ? (
                                  <span />
                                ) : (
                                  <Button variant="outline" size="sm" onClick={() => addOption(ci, qi)}>
                                    Add Option
                                  </Button>
                                )}
                                <Button variant="danger" size="sm" onClick={() => removeQuestion(ci, qi)}>
                                  Remove
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>

                      <Button variant="outline" size="sm" onClick={() => addQuestion(ci)}>
                        Add Question
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </div>

          <div className="flex-shrink-0 flex justify-end gap-3 pt-4 mt-2 border-t border-amana-neutral-200">
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                setCreateOpen(false);
                if (editingAssessment) setViewAssessment(editingAssessment);
                setEditingAssessment(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" size="lg" disabled={processing} onClick={handleSave}>
              {processing ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </SectionCard>
      ) : (
        <SectionCard
          title="Manage Competency Assessment"
          scroll
          className="max-h-[500px]"
          action={
            <Button variant="primary" size="md" onClick={openCreateForm}>
              Create Assessment
            </Button>
          }
        >
          <DataTable
            columns={columns}
            rows={rows}
            defaultSortKey="judul"
            emptyMessage='No assessments yet. Click "Create Assessment" to add one.'
            compact
          />
        </SectionCard>
      )}

      <AnimatePresence>
        {viewAssessment && (
          <Modal title={viewAssessment.judul} onClose={() => setViewAssessment(null)} maxWidth="max-w-2xl" className="max-h-[90vh]">
            <div className="flex-1 min-h-0 overflow-y-auto scroll-smooth p-5 flex flex-col gap-3">
              <p className="text-[14px] text-amana-neutral-400">{viewAssessment.deskripsi ?? '-'}</p>
              <div className="flex gap-2 items-center">
                <StatusPill color={statusColorFor(viewAssessment.idStatus)}>{viewAssessment.statusLabel}</StatusPill>
                <span className="text-[13px] text-amana-neutral-400">
                  {viewAssessment.totalPeserta} participant(s) · {viewAssessment.categories.length} field(s)
                </span>
              </div>
              {viewAssessment.categories.map((cat) => (
                <div key={cat.idKategoriAsm} className="p-3 rounded-[5px] bg-amana-neutral-200/40 border border-amana-neutral-300">
                  <p className="font-semibold text-[15px] text-amana-neutral-500 mb-2">{cat.namaKategori}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {cat.questions.map((q) => (
                      <span key={q.idPertanyaan} className="text-[13px] px-2 py-1 rounded-lg bg-amana-neutral-100 border border-amana-neutral-300 text-amana-neutral-400">
                        {q.teks}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex-shrink-0 flex justify-end gap-3 px-5 py-4 border-t border-amana-neutral-200">
              <Button variant="danger-outline" size="lg" onClick={() => { setDeleteTarget(viewAssessment); setViewAssessment(null); }}>
                Delete
              </Button>
              <Button variant="primary" size="lg" onClick={() => openEditForm(viewAssessment)}>
                Edit
              </Button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {confirmTarget && (
        <ConfirmModal
          title={confirmTarget.idStatus === ASSESSMENT_STATUS.OPEN ? 'Close Assessment' : 'Open Assessment'}
          message={
            confirmTarget.idStatus === ASSESSMENT_STATUS.OPEN
              ? <>Are you sure you want to close <span className="font-semibold">{confirmTarget.judul}</span>? Participants will no longer be able to submit answers.</>
              : <>Are you sure you want to reopen <span className="font-semibold">{confirmTarget.judul}</span>?</>
          }
          confirmLabel={confirmTarget.idStatus === ASSESSMENT_STATUS.OPEN ? 'Close' : 'Open'}
          loadingLabel="Saving..."
          loading={processing}
          onConfirm={() => { handleToggle(confirmTarget); setConfirmTarget(null); }}
          onCancel={() => setConfirmTarget(null)}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Delete Assessment"
          message={
            <>Are you sure you want to delete <span className="font-semibold">{deleteTarget.judul}</span>? All questions and participant submissions will be permanently deleted and cannot be recovered.</>
          }
          confirmLabel="Delete"
          loadingLabel="Deleting..."
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <StatusModal state={status} onClose={() => setStatus(null)} />
    </div>
  );
}
