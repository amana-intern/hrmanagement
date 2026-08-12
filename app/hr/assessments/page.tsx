'use client';

import PageTopBar from '../../components/layout/PageTopBar';
import AssessmentManager from '../../components/hr/AssessmentManager';

// Halaman /hr/assessments kini memakai komponen yang sama dengan tab
// "Kelola Assessment" di Talent Roster.
export default function HrAssessmentsPage() {
  return (
    <div className="w-full h-full flex flex-col gap-3">
      <PageTopBar showGreeting section="Career Hub" page="Competency Assessment" />
      <div className="flex-1 min-h-0">
        <AssessmentManager />
      </div>
    </div>
  );
}