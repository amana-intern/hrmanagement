'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronDown, X } from 'lucide-react';
import { PageTopBar, ToggleButton } from '../../../components/ui';
import { springSnappy } from '@/app/utils/motion';
import { cn } from '@/app/utils/cn';

const COMPETENCY_RESULTS = [
  { field: 'Digital Transformation & Govtech', score: 5.5 },
  { field: 'Health & Wellbeing', score: 6.8 },
  { field: 'Human Resource & Operation', score: 4.9 },
  { field: 'Public Policy & Social Development', score: 7.2 },
  { field: 'Research & Consulting', score: 5.5 },
  { field: 'Technology & Data Analytics', score: 6.1 },
];

const SIGNIFICANT_SKILLS = ['Research', 'Project Management', 'Designing'];
const DEVELOPMENT_AREAS = ['Research', 'Project Management', 'Designing'];

type SortColumn = 'field' | 'score';
type SortDirection = 'asc' | 'desc';

export default function CompetencyAssessmentResultPage() {
  const router = useRouter();
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [sort, setSort] = useState<{ column: SortColumn; direction: SortDirection } | null>(null);

  const toggleSort = (column: SortColumn) => {
    setSort((prev) =>
      prev && prev.column === column ? { column, direction: prev.direction === 'asc' ? 'desc' : 'asc' } : { column, direction: 'asc' }
    );
  };

  const visibleResults = selectedField ? COMPETENCY_RESULTS.filter((r) => r.field === selectedField) : COMPETENCY_RESULTS;
  const sortedResults = sort
    ? [...visibleResults].sort((a, b) => {
        const cmp = sort.column === 'field' ? a.field.localeCompare(b.field) : a.score - b.score;
        return sort.direction === 'asc' ? cmp : -cmp;
      })
    : visibleResults;

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

          <div className="flex-1 min-h-0 overflow-y-auto scroll-smooth flex flex-col gap-4 pr-1">
            <div className="bg-amana-neutral-100 rounded-[5px] border border-amana-primary-500 shadow-sm px-5 py-2.5">
              <h3 className="text-[20px] font-semibold text-amana-primary-500">Average Score</h3>
              <p className="text-[13px] text-amana-neutral-400 mb-3">Average score you fill on each field</p>
              <div className="flex gap-2 pt-3 border-t border-amana-primary-500">
                <ToggleButton
                  selected={selectedField === null}
                  onClick={() => setSelectedField(null)}
                  className="flex-1 min-w-0 whitespace-normal text-center px-2 py-1.5 text-[13px] leading-[1.15]"
                >
                  Average
                </ToggleButton>
                {COMPETENCY_RESULTS.map(({ field }) => (
                  <ToggleButton
                    key={field}
                    selected={selectedField === field}
                    onClick={() => setSelectedField(field)}
                    className="flex-1 min-w-0 whitespace-normal text-center px-2 py-1.5 text-[13px] leading-[1.15]"
                  >
                    {field}
                  </ToggleButton>
                ))}
              </div>
            </div>

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
                          {score.toFixed(1)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-amana-neutral-100 rounded-[5px] border border-amana-primary-500 shadow-sm px-5 py-2.5">
                <h4 className="text-[18px] font-sans font-semibold not-italic text-amana-primary-500 pb-1.5 mb-2 border-b border-amana-primary-500">
                  Significant technical skills
                </h4>
                <div className="flex flex-col divide-y divide-amana-neutral-200">
                  {SIGNIFICANT_SKILLS.map((skill) => (
                    <p key={skill} className="text-[15px] text-amana-neutral-500 py-1.5">
                      {skill}
                    </p>
                  ))}
                </div>
              </div>
              <div className="bg-amana-neutral-100 rounded-[5px] border border-amana-primary-500 shadow-sm px-5 py-2.5">
                <h4 className="text-[18px] font-sans font-semibold not-italic text-amana-primary-500 pb-1.5 mb-2 border-b border-amana-primary-500">
                  Self development areas
                </h4>
                <div className="flex flex-col divide-y divide-amana-neutral-200">
                  {DEVELOPMENT_AREAS.map((area) => (
                    <p key={area} className="text-[15px] text-amana-neutral-500 py-1.5">
                      {area}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}
