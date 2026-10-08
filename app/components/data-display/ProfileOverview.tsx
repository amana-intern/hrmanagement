'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageTopBar from '../layout/PageTopBar';
import NotificationBell from '../ui/NotificationBell';
import Button from '../forms/Button';
import Modal from '../feedback/Modal';
import PdfPreviewModal, { type PdfPreviewTarget } from '../feedback/PdfPreviewModal';
import StatBox, { type Stat } from './StatBox';
import CareerHistoryModal, { type CareerHistoryEntry } from './CareerHistoryModal';
import { EmployeeDetailsContent, type EmployeeCertificate } from './EmployeeDetailsModal';
import { HRPortalFeed } from './HRPortal';
import { cn } from '@/app/utils/cn';

export type { Stat };

export interface SummaryPanelConfig {
  title: string;
  stats: Stat[];
  updates: string[];
}

export interface ProfileBio {
  name: string;
  role: string;
  email: string;
  phone: string;
  photoSrc?: string;
}

/** Extra fields for the full "Employee Details" modal — only needed when `showCareerHistory` is set. */
export interface ProfileBioDetails {
  grade: string;
  department: string;
  position: string;
  contractType: string;
  /** Akses web app (Employee/Partner/Admin HR/Admin OPS) — sama dgn kolom Web App Access di HR. */
  webAppAccess?: string;
}

const CONTRACT_LABELS: Record<string, string> = { PKWTT: 'PKWTT', PKWT: 'PKWT', KKI: 'KKI', INTERNSHIP: 'Internship', KONTRAK: 'Contract' };

function SummaryPanel({ title, stats, updates }: SummaryPanelConfig) {
  return (
    <div className="flex-1 min-h-0 flex flex-col bg-amana-neutral-100 rounded-[5px] border border-amana-primary-500 shadow-sm px-4 py-2.5">
      <h3 className="flex-shrink-0 text-[20px] font-semibold text-amana-primary-500 pb-1.5 mb-2 border-b border-amana-primary-500">
        {title}
      </h3>
      <div className="flex-shrink-0 flex gap-2 mb-2">
        {stats.map((s, i) => (
          <StatBox key={i} {...s} />
        ))}
      </div>
      <div className="flex-1 min-h-0 border-t border-amana-neutral-300 pt-1.5 overflow-y-auto scroll-smooth">
        {updates.map((text, i) => (
          <div
            key={i}
            className={cn(
              'flex items-center gap-2 py-1.5 text-[16px] text-amana-neutral-500',
              i < updates.length - 1 && 'border-b border-amana-neutral-200'
            )}
          >
            <span className="w-2 h-2 rounded-full border border-amana-primary-500 flex-shrink-0" />
            {text}
          </div>
        ))}
      </div>
    </div>
  );
}

function EmployeeBio({ name, role, email, phone, photoSrc, onViewDetails }: ProfileBio & { onViewDetails?: () => void }) {
  return (
    <div className="flex-shrink-0 bg-amana-neutral-100 rounded-[5px] border border-amana-primary-500 shadow-sm px-4 py-2.5">
      <div className="flex items-center justify-between pb-1.5 mb-3 border-b border-amana-primary-500">
        <h3 className="text-[20px] font-semibold text-amana-primary-500">Employee Bio</h3>
        <NotificationBell />
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0 text-right">
          <p className="text-[35px] font-light text-amana-primary-500 leading-tight break-words">{name}</p>
          <div className="border-t border-amana-neutral-300 my-1" />
          <p className="text-[19px] font-light text-amana-primary-500 truncate">{role}</p>
          <div className="border-t border-amana-neutral-300 my-1" />
          <a href={`mailto:${email}`} className="text-[19px] font-light text-amana-primary-500 truncate block hover:underline">
            {email}
          </a>
          <div className="border-t border-amana-neutral-300 my-1" />
          <p className="text-[19px] font-light text-amana-primary-500 truncate">{phone}</p>
        </div>
        <div className="w-[92px] h-[123px] rounded-[8px] overflow-hidden border border-amana-primary-500 shadow-md flex-shrink-0 bg-amana-neutral-200 flex items-center justify-center">
          {photoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoSrc} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-[28px] font-semibold text-amana-primary-500">
              {name
                .split(' ')
                .map((w) => w[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()}
            </span>
          )}
        </div>
      </div>
      {onViewDetails && (
        <Button variant="primary" size="md" className="w-full mt-3" onClick={onViewDetails}>
          View Details
        </Button>
      )}
    </div>
  );
}

export interface ProfileOverviewProps {
  panels: [SummaryPanelConfig, SummaryPanelConfig];
  bio: ProfileBio;
  /** Grade/department/position/contract — required when `showCareerHistory` is set, shown in the full Employee Details modal. */
  bioDetails?: ProfileBioDetails;
  showGreeting?: boolean;
  /** Show a "View Details" button on the Employee Bio card, opening the user's own full Employee Details (bio, assessment, certificates, career history). */
  showCareerHistory?: boolean;
}

export default function ProfileOverview({
  panels,
  bio,
  bioDetails,
  showGreeting = false,
  showCareerHistory = false,
}: ProfileOverviewProps) {
  const router = useRouter();
  const [careerHistoryOpen, setCareerHistoryOpen] = useState(false);
  const [careerHistory, setCareerHistory] = useState<CareerHistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [certificates, setCertificates] = useState<EmployeeCertificate[]>([]);
  const [assessment, setAssessment] = useState<{ name?: string; done: boolean }>({ done: false });
  const [previewPdf, setPreviewPdf] = useState<PdfPreviewTarget | null>(null);

  const openCareerHistory = async () => {
    setCareerHistoryOpen(true);
    setLoadingHistory(true);
    try {
      const res = await fetch('/api/me/career-history', { cache: 'no-store' });
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

  const openDetails = async () => {
    setDetailsOpen(true);
    try {
      const [certRes, asmRes] = await Promise.all([
        fetch('/api/certificates', { cache: 'no-store' }),
        fetch('/api/assessments/open', { cache: 'no-store' }),
      ]);
      if (certRes.ok) {
        const data = await certRes.json();
        setCertificates((data.list ?? []).map((c: { judul: string; fileURL: string | null }) => ({ title: c.judul, fileURL: c.fileURL })));
      }
      if (asmRes.ok) {
        const data = await asmRes.json();
        setAssessment({ name: data.assessment?.judul, done: !!data.submission });
      }
    } catch {}
  };

  return (
    <div className="w-full h-full flex flex-col gap-3">
      <div className="flex-shrink-0">
        <PageTopBar showGreeting={showGreeting} />
      </div>

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4">
        <div className="flex flex-col gap-3 w-full lg:w-3/5 min-h-0">
          <SummaryPanel {...panels[0]} />
          <SummaryPanel {...panels[1]} />
        </div>

        <div className="flex flex-col gap-4 w-full lg:w-2/5 min-h-0">
          <EmployeeBio {...bio} onViewDetails={showCareerHistory ? openDetails : undefined} />
          <HRPortalFeed />
        </div>
      </div>

      {detailsOpen && bioDetails && (
        <Modal title="Employee Details" onClose={() => setDetailsOpen(false)} maxWidth="max-w-4xl" className="max-h-[90vh]">
          <EmployeeDetailsContent
            employee={{
              name: bio.name,
              grade: bioDetails.grade,
              department: bioDetails.department,
              position: bioDetails.position,
              contractType: CONTRACT_LABELS[bioDetails.contractType] ?? bioDetails.contractType,
              email: bio.email,
              phone: bio.phone,
              webAppAccess: bioDetails.webAppAccess,
              photoSrc: bio.photoSrc,
              assessmentDone: assessment.done,
              assessmentName: assessment.name,
              certificates,
            }}
            onViewAssessment={() => router.push('/user/careerhub/result')}
            onViewCertificate={(cert) => cert.fileURL && setPreviewPdf({ title: cert.title, url: cert.fileURL })}
            onViewCareerHistory={openCareerHistory}
          />
        </Modal>
      )}

      <PdfPreviewModal target={previewPdf} onClose={() => setPreviewPdf(null)} />

      {careerHistoryOpen && (
        <CareerHistoryModal
          employeeName={bio.name}
          history={careerHistory}
          loading={loadingHistory}
          current={
            bioDetails && {
              department: bioDetails.department,
              grade: bioDetails.grade,
              role: bioDetails.position,
            }
          }
          onClose={() => setCareerHistoryOpen(false)}
        />
      )}
    </div>
  );
}
