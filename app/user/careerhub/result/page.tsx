'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import PageTopBar from '../../../components/layout/PageTopBar';
import Button from '../../../components/forms/Button';
import AssessmentResultView from '../../../components/hr/AssessmentResultView';
import { springSnappy } from '@/app/utils/motion';

interface ResultCategory {
  idKategoriAsm: string;
  namaKategori: string;
  questions: { idPertanyaan: string; teks: string }[];
}

interface OpenAssessment {
  idAssessment: string;
  judul: string;
  deskripsi: string | null;
  categories: ResultCategory[];
}

interface Submission {
  technicalSkills: string | null;
  selfDevelopmentAreas: string | null;
  answers: Record<string, number>;
}

export default function CompetencyAssessmentResultPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [openAssessment, setOpenAssessment] = useState<OpenAssessment | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/assessments/open', { cache: 'no-store' });
        if (res.ok) {
          const d = await res.json();
          setOpenAssessment(d.assessment);
          setSubmission(d.submission);
        }
      } catch {}
      setLoading(false);
    })();
  }, []);

  const bidangSkor = useMemo(() => {
    if (!openAssessment || !submission) return undefined;
    const result: Record<string, number | null> = {};
    for (const cat of openAssessment.categories) {
      let sum = 0;
      let count = 0;
      for (const q of cat.questions) {
        const lvl = submission.answers?.[q.idPertanyaan];
        if (lvl && lvl >= 1 && lvl <= 4) {
          sum += lvl;
          count += 1;
        }
      }
      result[cat.idKategoriAsm] = count > 0 ? +(sum / count).toFixed(2) : null;
    }
    return result;
  }, [openAssessment, submission]);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-[16px] text-amana-neutral-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col gap-3">
      <PageTopBar
        showGreeting
        right={
          <>
            <span className="text-amana-neutral-300">Assessment Test</span> <span className="text-amana-neutral-300">{'>'}</span>{' '}
            <span className="text-amana-neutral-300">Competency Assessment</span> <span className="text-amana-neutral-300">{'>'}</span>{' '}
            View Result
          </>
        }
      />

      <div className="flex-1 min-h-0 flex flex-col bg-amana-neutral-100 rounded-[5px] border border-amana-primary-500 shadow-sm px-5 py-3 overflow-hidden">
        <div className="flex-shrink-0 flex items-center justify-between pb-2 mb-3 border-b border-amana-primary-500">
          <h2 className="text-[24px] font-semibold text-amana-primary-500">Competency Assessment Result</h2>
          <motion.button
            type="button"
            onClick={() => router.push('/user/careerhub')}
            whileHover={{ scale: 1.15, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            transition={springSnappy}
            className="text-amana-primary-500 hover:text-amana-danger-500"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </motion.button>
        </div>

        {submission && openAssessment ? (
          <AssessmentResultView
            categories={openAssessment.categories}
            assessment={{
              bidangSkor,
              answers: submission.answers,
              technicalSkills: submission.technicalSkills,
              selfDevelopmentAreas: submission.selfDevelopmentAreas,
            }}
          />
        ) : (
          <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-4">
            <p className="text-[16px] text-amana-neutral-400">
              {openAssessment ? `Not yet completed: ${openAssessment.judul || 'assessment'}.` : 'No assessment results available.'}
            </p>
            <div className="flex justify-center">
              <Button variant="primary" size="lg" onClick={() => router.push('/user/assessment')}>
                Take Assessment
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}