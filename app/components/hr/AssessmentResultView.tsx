'use client';

import { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import ToggleButton from '../forms/ToggleButton';
import { ASSESSMENT_LEVELS } from '@/lib/assessment-template';
import { cn } from '@/app/utils/cn';

export interface AssessmentResultQuestion {
  idPertanyaan: string;
  teks: string;
}

export interface AssessmentResultField {
  idKategoriAsm: string;
  namaKategori: string;
  questions?: AssessmentResultQuestion[];
}

export interface AssessmentResultData {
  bidangSkor?: Record<string, number | null>;
  technicalSkills?: string | null;
  selfDevelopmentAreas?: string | null;
  answers?: Record<string, number>;
}

interface AssessmentResultViewProps {
  categories: AssessmentResultField[];
  assessment: AssessmentResultData | null;
}

type SortColumn = 'field' | 'score';
type SortDirection = 'asc' | 'desc';

const SELF_ASSESSMENT_FIELD = '__self_assessment__';
const SELF_ASSESSMENT_LABEL = 'Self Assessment & Need for development';

function toList(value: string | null | undefined): string[] {
  if (!value) return [];
  const lines = value
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (lines.length > 1) return lines;
  return lines[0]
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function AssessmentResultView({ categories, assessment }: AssessmentResultViewProps) {
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [sort, setSort] = useState<{ column: SortColumn; direction: SortDirection } | null>(null);

  const fields = useMemo(
    () =>
      categories.map((c) => ({
        id: c.idKategoriAsm,
        field: c.namaKategori,
        score: assessment?.bidangSkor?.[c.idKategoriAsm] ?? null,
      })),
    [categories, assessment]
  );

  const selectedCategory = useMemo(
    () => (selectedField ? (categories.find((c) => c.namaKategori === selectedField) ?? null) : null),
    [categories, selectedField]
  );

  const toggleSort = (column: SortColumn) => {
    setSort((prev) =>
      prev && prev.column === column
        ? { column, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { column, direction: 'asc' }
    );
  };

  const visibleResults = selectedField ? fields.filter((r) => r.field === selectedField) : fields;
  const sortedResults = sort
    ? [...visibleResults].sort((a, b) => {
        const cmp =
          sort.column === 'field'
            ? a.field.localeCompare(b.field)
            : (a.score ?? -1) - (b.score ?? -1);
        return sort.direction === 'asc' ? cmp : -cmp;
      })
    : visibleResults;

  const skills = toList(assessment?.technicalSkills);
  const developmentAreas = toList(assessment?.selfDevelopmentAreas);

  if (!assessment) {
    return <p className="text-sm text-amana-neutral-400">No assessment data available.</p>;
  }

  const selfAssessmentSection = (
    <div className="bg-amana-neutral-100 rounded-[5px] border border-amana-primary-500 shadow-sm px-5 py-2.5">
      <h4 className="text-[18px] font-sans font-semibold not-italic text-amana-primary-500 pb-1.5 mb-2 border-b border-amana-primary-500">
        {SELF_ASSESSMENT_LABEL}
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <p className="text-[14px] font-semibold text-amana-neutral-500 pb-1 mb-2 border-b border-amana-neutral-200">
            1-3 most significant technical skills
          </p>
          <div className="flex flex-col divide-y divide-amana-neutral-200">
            {skills.length > 0 ? (
              skills.map((item, idx) => (
                <p key={idx} className="text-[15px] text-amana-neutral-500 py-1.5">
                  {item}
                </p>
              ))
            ) : (
              <p className="text-[14px] text-amana-neutral-400 py-1.5">-</p>
            )}
          </div>
        </div>
        <div>
          <p className="text-[14px] font-semibold text-amana-neutral-500 pb-1 mb-2 border-b border-amana-neutral-200">
            Self-Development Areas
          </p>
          <div className="flex flex-col divide-y divide-amana-neutral-200">
            {developmentAreas.length > 0 ? (
              developmentAreas.map((item, idx) => (
                <p key={idx} className="text-[15px] text-amana-neutral-500 py-1.5">
                  {item}
                </p>
              ))
            ) : (
              <p className="text-[14px] text-amana-neutral-400 py-1.5">-</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex-1 min-h-0 overflow-y-auto scroll-smooth flex flex-col gap-4 pr-1">
      <div className="bg-amana-neutral-100 rounded-[5px] border border-amana-primary-500 shadow-sm px-5 py-2.5">
        <div className="flex flex-wrap gap-2">
          <ToggleButton
            selected={selectedField === null}
            onClick={() => setSelectedField(null)}
            className="grow min-w-0 whitespace-normal text-center px-2 py-1.5 text-[13px] leading-[1.15]"
          >
            Average
          </ToggleButton>
          {fields.map(({ field }) => (
            <ToggleButton
              key={field}
              selected={selectedField === field}
              onClick={() => setSelectedField(field)}
              className="grow min-w-0 whitespace-normal text-center px-2 py-1.5 text-[13px] leading-[1.15]"
            >
              {field}
            </ToggleButton>
          ))}
          <ToggleButton
            selected={selectedField === SELF_ASSESSMENT_FIELD}
            onClick={() => setSelectedField(SELF_ASSESSMENT_FIELD)}
            className="grow min-w-0 whitespace-normal text-center px-2 py-1.5 text-[13px] leading-[1.15]"
          >
            {SELF_ASSESSMENT_LABEL}
          </ToggleButton>
        </div>
      </div>

      {selectedField === SELF_ASSESSMENT_FIELD ? (
        selfAssessmentSection
      ) : selectedCategory ? (
        <div className="bg-amana-neutral-100 rounded-[5px] border border-amana-primary-500 shadow-sm px-5 py-2.5">
          <h4 className="text-[18px] font-sans font-semibold not-italic text-amana-primary-500 pb-1.5 mb-2 border-b border-amana-primary-500">
            {selectedCategory.namaKategori}
          </h4>
          <div className="flex flex-col divide-y divide-amana-neutral-200">
            {selectedCategory.questions && selectedCategory.questions.length > 0 ? (
              selectedCategory.questions.map((q) => {
                const level = assessment.answers?.[q.idPertanyaan];
                const lvl = ASSESSMENT_LEVELS.find((l) => l.level === level);
                return (
                  <div key={q.idPertanyaan} className="min-h-[42px] flex items-center justify-between gap-3 py-1">
                    <span className="text-[15px] text-amana-neutral-500">{q.teks}</span>
                    <span
                      className={cn(
                        'flex-shrink-0 rounded-full px-4 py-1 text-[14px] font-semibold',
                        lvl ? 'bg-amana-success-500 text-amana-neutral-100' : 'bg-amana-neutral-300 text-amana-neutral-500'
                      )}
                    >
                      {lvl ? `L${lvl.level} (${lvl.label})` : '-'}
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="text-[14px] text-amana-neutral-400 py-1.5">No competencies in this field.</p>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="bg-amana-neutral-100 rounded-[5px] border border-amana-primary-500 shadow-sm px-5 py-2.5">
            <div className="flex items-stretch">
              <div className="flex-1 min-w-0 flex flex-col">
                <button
                  type="button"
                  onClick={() => toggleSort('field')}
                  className="flex items-center justify-between gap-2 pb-1.5 border-b border-amana-primary-500 cursor-pointer group"
                >
                  <h4 className="text-[18px] font-sans font-semibold not-italic text-amana-primary-500">Field</h4>
                  <ChevronDown
                    className={cn(
                      'w-4 h-4 flex-shrink-0 transition-transform duration-200 group-hover:text-amana-primary-400',
                      sort?.column === 'field' ? 'text-amana-primary-500' : 'text-amana-neutral-300',
                      sort?.column === 'field' && sort.direction === 'desc' && 'rotate-180'
                    )}
                  />
                </button>
                <div className="flex flex-col divide-y divide-amana-neutral-200">
                  {sortedResults.map(({ field }) => (
                    <div key={field} className="min-h-[42px] flex items-center text-[15px] text-amana-neutral-500">
                      {field}
                    </div>
                  ))}
                </div>
              </div>

              <div className="w-px flex-shrink-0 bg-amana-neutral-300 mx-4" />

              <div className="w-[260px] flex-shrink-0 flex flex-col">
                <button
                  type="button"
                  onClick={() => toggleSort('score')}
                  className="flex items-center justify-between gap-2 pb-1.5 border-b border-amana-primary-500 cursor-pointer group"
                >
                  <h4 className="text-[18px] font-sans font-semibold not-italic text-amana-primary-500">Average Score</h4>
                  <ChevronDown
                    className={cn(
                      'w-4 h-4 flex-shrink-0 transition-transform duration-200 group-hover:text-amana-primary-400',
                      sort?.column === 'score' ? 'text-amana-primary-500' : 'text-amana-neutral-300',
                      sort?.column === 'score' && sort.direction === 'desc' && 'rotate-180'
                    )}
                  />
                </button>
                <div className="flex flex-col divide-y divide-amana-neutral-200">
                  {sortedResults.map(({ field, score }) => (
                    <div key={field} className="min-h-[42px] flex items-center">
                      <span className="flex w-full items-center justify-center rounded-full bg-amana-success-500 text-amana-neutral-100 text-[14px] font-semibold px-5 py-1">
                        {score != null ? score.toFixed(1) : '-'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {selfAssessmentSection}
        </>
      )}
    </div>
  );
}