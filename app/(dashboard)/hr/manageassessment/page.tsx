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
import StatusModal, { StatusState } from '@/app/components/feedback/StatusModal';
import SectionCard from '@/app/components/layout/SectionCard';
import DataTable from '@/app/components/data-display/DataTable';
import { TableSkeleton } from '@/app/components/feedback/PageSkeleton';
import type { DataTableColumn } from '@/app/components/data-display/DataTable';
import StatusPill from '@/app/components/data-display/StatusPill';
import { ASSESSMENT_LEVELS } from '@/lib/assessment-template';
import { ASSESSMENT_STATUS, ASSESSMENT_QUESTION_TYPES, ASSESSMENT_QUESTION_TYPE_LABELS } from '@/lib/constants';

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
type DraftQuestion = { id: string; teks: string; tipeSoal: QuestionType; options: DraftOption[] };

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
  const [status, setStatus] = useState<StatusState | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [judul, setJudul] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [openOnCreate, setOpenOnCreate] = useState(true);
  const [draftQuestions, setDraftQuestions] = useState<DraftQuestion[]>([]);
  const [viewAssessment, setViewAssessment] = useState<Assessment | null>(null);

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
    setJudul('');
    setDeskripsi('');
    setOpenOnCreate(true);
    setDraftQuestions([blankQuestion()]);
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

  const handleCreate = async () => {
    if (!judul.trim()) {
      setStatus({ ok: false, text: 'Title is required' });
      return;
    }
    const questions = draftQuestions.filter((q) => q.teks.trim() !== '');
    if (questions.length === 0) {
      setStatus({ ok: false, text: 'At least 1 question is required' });
      return;
    }
    const missingOptions = questions.some(
      (q) =>
        q.tipeSoal !== ASSESSMENT_QUESTION_TYPES.SHORT_ANSWER &&
        q.options.filter((o) => o.teks.trim() !== '').length < 2
    );
    if (missingOptions) {
      setStatus({ ok: false, text: 'Multiple choice / checkbox questions need at least 2 options' });
      return;
    }

    setProcessing(true);
    const res = await fetch('/api/hr/assessments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        judul,
        deskripsi,
        categories: [
          {
            namaKategori: judul,
            questions: questions.map((q) => ({
              teks: q.teks,
              tipeSoal: q.tipeSoal,
              options:
                q.tipeSoal === ASSESSMENT_QUESTION_TYPES.SHORT_ANSWER
                  ? []
                  : q.options.filter((o) => o.teks.trim() !== ''),
            })),
          },
        ],
        open: openOnCreate,
      }),
    });
    const d = await res.json().catch(() => null);
    setProcessing(false);
    if (!res.ok) {
      setStatus({ ok: false, text: d?.error || 'Failed to create assessment' });
      return;
    }

    setCreateOpen(false);
    await load();
    setStatus({ ok: true, text: `Assessment "${judul}" successfully created.` });
  };

  const updateQuestion = (qi: number, patch: Partial<DraftQuestion>) => {
    setDraftQuestions((prev) => prev.map((q, i) => (i === qi ? { ...q, ...patch } : q)));
  };

  const changeQuestionType = (qi: number, tipeSoal: QuestionType) => {
    setDraftQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qi) return q;
        const options =
          tipeSoal !== ASSESSMENT_QUESTION_TYPES.SHORT_ANSWER && q.options.length === 0
            ? [blankOption(), blankOption()]
            : q.options;
        return { ...q, tipeSoal, options };
      })
    );
  };

  const updateOption = (qi: number, oi: number, teks: string) => {
    setDraftQuestions((prev) =>
      prev.map((q, i) => (i === qi ? { ...q, options: q.options.map((o, j) => (j === oi ? { ...o, teks } : o)) } : q))
    );
  };

  const addOption = (qi: number) => {
    setDraftQuestions((prev) => prev.map((q, i) => (i === qi ? { ...q, options: [...q.options, blankOption()] } : q)));
  };

  const removeOption = (qi: number, oi: number) => {
    setDraftQuestions((prev) =>
      prev.map((q, i) => (i === qi ? { ...q, options: q.options.filter((_, j) => j !== oi) } : q))
    );
  };

  const rows: AssessmentRow[] = assessments.map((a) => ({ ...a, id: a.idAssessment }));

  const columns: DataTableColumn<AssessmentRow>[] = [
    {
      key: 'judul',
      label: 'Title',
      render: (a) => (
        <button onClick={() => setViewAssessment(a)} className="hover:text-amana-primary-500 transition-colors font-semibold">
          {a.judul}
        </button>
      ),
    },
    {
      key: 'statusLabel',
      label: 'Status',
      render: (a) => <StatusPill color={statusColorFor(a.idStatus)}>{a.statusLabel}</StatusPill>,
    },
    {
      key: 'tanggalBuka',
      label: 'Period',
      render: (a) => (
        <span className="whitespace-nowrap">
          {a.tanggalBuka ? new Date(a.tanggalBuka).toLocaleDateString('en-GB') : '-'}
          {a.tanggalTutup ? ` - ${new Date(a.tanggalTutup).toLocaleDateString('en-GB')}` : ''}
        </span>
      ),
    },
    { key: 'totalPeserta', label: 'Participants' },
    {
      key: 'id',
      label: 'Action',
      render: (a) => (
        <Button
          variant={a.idStatus === ASSESSMENT_STATUS.OPEN ? 'outline' : 'primary'}
          size="sm"
          className="w-full"
          disabled={processing}
          onClick={() => handleToggle(a)}
        >
          {a.idStatus === ASSESSMENT_STATUS.OPEN ? 'Close' : 'Open'}
        </Button>
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
          title="Create Assessment"
          scroll
          className="flex-1"
          action={
            <button
              onClick={() => setCreateOpen(false)}
              className="text-amana-primary-500 hover:text-amana-danger-500"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          }
        >
          <div className="flex-1 min-h-0 overflow-y-auto scroll-smooth flex flex-col gap-4 pt-1">
            <TextField label="Assessment Title" value={judul} onChange={setJudul} placeholder="Assessment Title" />
            <TextField label="Assessment Description" value={deskripsi} onChange={setDeskripsi} placeholder="Short description" />
            <SelectField
              label="Status on Creation"
              value={openOnCreate ? 'open' : 'closed'}
              onChange={(v) => setOpenOnCreate(v === 'open')}
              options={['open', 'closed']}
              labels={{ open: 'Open Immediately', closed: 'Closed (draft)' }}
            />

            <motion.div layout transition={{ duration: durationFast, ease: easeOut }} className="border-t border-amana-neutral-200 pt-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[16px] font-semibold text-amana-neutral-500">Questions</label>
                <Button variant="outline" size="sm" onClick={() => setDraftQuestions((p) => [...p, blankQuestion()])}>
                  Add Field
                </Button>
              </div>

              <AnimatePresence initial={false}>
                {draftQuestions.map((q, qi) => (
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
                        <div className="flex-1">
                          <TextField value={q.teks} onChange={(v) => updateQuestion(qi, { teks: v })} placeholder="Question" label="" />
                        </div>
                        <div className="w-[180px] flex-shrink-0">
                          <SelectField
                            value={q.tipeSoal}
                            onChange={(v) => changeQuestionType(qi, v as QuestionType)}
                            options={QUESTION_TYPE_VALUES}
                            labels={ASSESSMENT_QUESTION_TYPE_LABELS}
                            label=""
                          />
                        </div>
                      </div>

                      {q.tipeSoal === ASSESSMENT_QUESTION_TYPES.SHORT_ANSWER ? (
                        <p className="text-[14px] text-amana-neutral-300 italic border-b border-amana-neutral-300 pb-1.5 mb-2">
                          Short answer text
                        </p>
                      ) : (
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
                                <span
                                  className={
                                    q.tipeSoal === ASSESSMENT_QUESTION_TYPES.CHECKBOX
                                      ? 'w-4 h-4 flex-shrink-0 rounded-[4px] border border-amana-neutral-300'
                                      : 'w-4 h-4 flex-shrink-0 rounded-full border border-amana-neutral-300'
                                  }
                                />
                                <div className="flex-1">
                                  <TextField value={o.teks} onChange={(v) => updateOption(qi, oi, v)} placeholder={`Option ${oi + 1}`} label="" />
                                </div>
                                <button
                                  onClick={() => removeOption(qi, oi)}
                                  className="text-amana-neutral-400 hover:text-amana-danger-500 bg-transparent border-none cursor-pointer"
                                  aria-label="Remove option"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </motion.div>
                      )}

                      <div className="flex items-center justify-between">
                        {q.tipeSoal === ASSESSMENT_QUESTION_TYPES.SHORT_ANSWER ? (
                          <span />
                        ) : (
                          <Button variant="outline" size="sm" onClick={() => addOption(qi)}>
                            Add Option
                          </Button>
                        )}
                        <Button variant="danger" size="sm" onClick={() => setDraftQuestions((p) => p.filter((_, i) => i !== qi))}>
                          Remove
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </div>

          <div className="flex-shrink-0 flex justify-end gap-3 pt-4 mt-2 border-t border-amana-neutral-200">
            <Button variant="outline" size="lg" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="lg" disabled={processing} onClick={handleCreate}>
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
              <div className="p-3 rounded-[5px] bg-amana-primary-100/40 border border-amana-neutral-300">
                <p className="text-[13px] font-semibold text-amana-neutral-400 mb-1">Proficiency levels</p>
                <div className="space-y-0.5">
                  {ASSESSMENT_LEVELS.map((l) => (
                    <p key={l.level} className="text-[13px] text-amana-neutral-400">
                      Level {l.level} ({l.label}): {l.description}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      <StatusModal state={status} onClose={() => setStatus(null)} />
    </div>
  );
}
