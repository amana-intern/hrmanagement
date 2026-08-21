'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageTopBar from '../../components/layout/PageTopBar';
import SectionCard from '../../components/layout/SectionCard';
import Button from '../../components/forms/Button';
import { ASSESSMENT_LEVELS } from '@/lib/assessment-template';

interface AsmCategory {
  idKategoriAsm: string;
  namaKategori: string;
  questions: { idPertanyaan: string; teks: string }[];
}

interface OpenAssessment {
  idAssessment: string;
  judul: string;
  deskripsi: string | null;
  categories: AsmCategory[];
}

export default function AssessmentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [openAssessment, setOpenAssessment] = useState<OpenAssessment | null>(null);
  const [submission, setSubmission] = useState<{ idSubmission: string } | null>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [technicalSkills, setTechnicalSkills] = useState('');
  const [selfDevelopmentAreas, setSelfDevelopmentAreas] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);
  const isFirstScroll = useRef(true);

  useEffect(() => {
    if (isFirstScroll.current) {
      isFirstScroll.current = false;
      return;
    }
    if (!openAssessment) return;
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [step, openAssessment]);

  useEffect(() => {
    (async () => {
      try {
        const open = await fetch('/api/assessments/open', { cache: 'no-store' });
        if (open.ok) {
          const d = await open.json();
          setOpenAssessment(d.assessment);
          setSubmission(d.submission);
        }
      } catch {}
      setLoading(false);
    })();
  }, []);

  const handleSubmit = async () => {
    if (!openAssessment) return;
    if (!technicalSkills.trim() || !selfDevelopmentAreas.trim()) {
      alert('Technical skills & Self-development areas are required.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/assessments/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idAssessment: openAssessment.idAssessment,
          answers,
          technicalSkills,
          selfDevelopmentAreas,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to save assessment results');
      router.push('/user/careerhub');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-[16px] text-amana-neutral-400">Loading...</p>
      </div>
    );
  }

  if (!openAssessment) {
    return (
      <div className="w-full h-full flex flex-col gap-3">
        <PageTopBar showGreeting section="Career Hub" page="Competency Assessment" />
        <SectionCard className="text-center">
          <p className="font-semibold text-amana-primary-500 text-[20px] mb-2">No assessment available</p>
          <p className="text-[14px] text-amana-neutral-400 mb-6">No assessment is open at the moment.</p>
          <div className="flex justify-center">
            <Button variant="primary" size="lg" onClick={() => router.push('/user/careerhub')}>
              Back to Career Hub
            </Button>
          </div>
        </SectionCard>
      </div>
    );
  }

  if (submission) {
    return (
      <div className="w-full h-full flex flex-col gap-3">
        <PageTopBar showGreeting section="Career Hub" page="Competency Assessment" />
        <SectionCard>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <span className="flex-1 text-[20px] font-semibold text-amana-neutral-500 truncate">{openAssessment.judul}</span>
            <div className="flex-1 flex items-center justify-center rounded-full px-5 py-1.5 text-center text-[14px] font-medium text-amana-neutral-100 bg-amana-success-500">
              Done
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <Button variant="primary" size="lg" onClick={() => router.push('/user/careerhub/result')}>
                View Result
              </Button>
              <Button variant="ghost" size="lg" onClick={() => router.push('/user/careerhub')}>
                Back to Career Hub
              </Button>
            </div>
          </div>
          <p className="text-[14px] text-amana-neutral-400 mt-3">
            You have completed this assessment. You can view your results or update your CV/certificates in Career Hub.
          </p>
        </SectionCard>
      </div>
    );
  }

  const totalSteps = openAssessment.categories.length + 1;
  const lastStep = totalSteps - 1;
  const cat = step < openAssessment.categories.length ? openAssessment.categories[step] : null;

  return (
    <div className="w-full h-full flex flex-col gap-3">
      <PageTopBar showGreeting section="Career Hub" page="Competency Assessment" />

      <div ref={topRef} className="flex flex-col gap-3">
        <SectionCard>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-[24px] font-semibold text-amana-primary-500 leading-tight">{openAssessment.judul}</h2>
              <p className="text-[14px] text-amana-neutral-400 mt-1">
                {(openAssessment.deskripsi ?? '').trim() === 'Self assessment kompetensi seluruh karyawan.'
                  ? 'Self assessment of all employees.'
                  : (openAssessment.deskripsi ?? undefined) ??
                    'Select a proficiency level for each competency. Competencies may be skipped (not required).'}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-[13px] font-semibold text-amana-primary-500">Field {step + 1} of {totalSteps}</p>
              <div className="flex gap-1 mt-1 justify-end">
                {[...Array(totalSteps)].map((_, i) => (
                  <span
                    key={i}
                    className={`w-2 h-2 rounded-full ${i === step ? 'bg-amana-primary-500' : i < step ? 'bg-amana-primary-300' : 'bg-amana-neutral-300'}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard scroll>
          {cat ? (
            <div key={cat.idKategoriAsm}>
              <p className="text-[16px] font-semibold text-amana-primary-500 mb-3">{cat.namaKategori}</p>
              <div className="flex flex-col gap-3">
                {cat.questions.map((q) => (
                  <div key={q.idPertanyaan} className="p-3 rounded-[8px] bg-amana-neutral-100 border border-amana-primary-500">
                    <p className="text-[15px] font-medium text-black mb-2">{q.teks}</p>
                    <div className="flex flex-col gap-1">
                      {ASSESSMENT_LEVELS.map((lvl) => {
                        const active = answers[q.idPertanyaan] === lvl.level;
                        return (
                          <label
                            key={lvl.level}
                            className={`flex items-start gap-2 px-2.5 py-1.5 rounded-lg border cursor-pointer transition-all ${
                              active ? 'border-amana-primary-500 bg-amana-primary-100' : 'border-amana-neutral-300 bg-amana-neutral-100 hover:border-amana-primary-300'
                            }`}
                          >
                            <input
                              type="radio"
                              name={q.idPertanyaan}
                              checked={active}
                              onChange={() => setAnswers((prev) => ({ ...prev, [q.idPertanyaan]: lvl.level }))}
                              className="mt-1 accent-amana-primary-500"
                            />
                            <span className="text-xs">
                              <span className="font-bold text-black">Level {lvl.level} ({lvl.label})</span>
                              <span className="block text-amana-neutral-400 mt-0.5">{lvl.description}</span>
                            </span>
                          </label>
                        );
                      })}
                      <button
                        onClick={() => setAnswers((prev) => {
                          const next = { ...prev };
                          delete next[q.idPertanyaan];
                          return next;
                        })}
                        className="text-xs text-amana-neutral-400 hover:text-amana-primary-500 bg-transparent border-none cursor-pointer self-end"
                      >
                        Delete answer on this competency
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <p className="text-[16px] font-semibold text-amana-primary-500 mb-3">Self Assessment & Need for development</p>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[16px] font-semibold text-amana-neutral-500">
                    Please list your 1-3 most significant technical skills <span className="text-amana-danger-500">*</span>
                  </label>
                  <textarea
                    value={technicalSkills}
                    onChange={(e) => setTechnicalSkills(e.target.value)}
                    rows={3}
                    placeholder="e.g.: Python, SQL, Project Management..."
                    className="w-full border border-amana-neutral-300 rounded-[13px] px-3 py-2.5 text-[16px] text-amana-neutral-500 placeholder:text-amana-neutral-300 bg-amana-neutral-100 transition-colors duration-200 focus:outline-none focus:border-amana-primary-500"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[16px] font-semibold text-amana-neutral-500">
                    Self-Development Areas <span className="text-amana-danger-500">*</span>
                  </label>
                  <textarea
                    value={selfDevelopmentAreas}
                    onChange={(e) => setSelfDevelopmentAreas(e.target.value)}
                    rows={3}
                    placeholder="Self-development areas you want to improve..."
                    className="w-full border border-amana-neutral-300 rounded-[13px] px-3 py-2.5 text-[16px] text-amana-neutral-500 placeholder:text-amana-neutral-300 bg-amana-neutral-100 transition-colors duration-200 focus:outline-none focus:border-amana-primary-500"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t border-amana-neutral-200">
            <div>
              {step > 0 && (
                <Button variant="ghost" size="lg" onClick={() => setStep((s) => Math.max(0, s - 1))}>
                  Previous
                </Button>
              )}
            </div>
            <div className="flex gap-3">
              {step < lastStep ? (
                <Button variant="primary" size="lg" onClick={() => setStep((s) => s + 1)}>
                  Next
                </Button>
              ) : (
                <Button variant="primary" size="lg" disabled={submitting} onClick={handleSubmit}>
                  {submitting ? 'Submitting...' : 'Submit'}
                </Button>
              )}
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}