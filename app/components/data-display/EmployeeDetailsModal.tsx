'use client';

import Modal from '../feedback/Modal';
import Button from '../forms/Button';
import StatusPill from './StatusPill';

export function AssessmentBadge({ done, fullWidth = false }: { done: boolean; fullWidth?: boolean }) {
  return (
    <StatusPill color={done ? 'bg-amana-success-500' : 'bg-amana-danger-500'} fullWidth={fullWidth}>
      {done ? 'Done' : 'Not Done'}
    </StatusPill>
  );
}

export interface EmployeeCertificate {
  title: string;
  fileURL: string | null;
}

export interface EmployeeDetails {
  name: string;
  grade: string;
  department: string;
  position: string;
  contractType: string;
  email: string;
  phone: string;
  photoSrc?: string;
  assessmentDone: boolean;
  assessmentName?: string;
  certificates: EmployeeCertificate[];
}

function DetailRow({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 border-b border-amana-neutral-200 text-[14px]">
      <span className="flex-shrink-0 font-medium text-amana-neutral-400">{label}:</span>
      {href ? (
        <a href={href} className="min-w-0 truncate text-amana-primary-500 hover:underline">
          {value || '-'}
        </a>
      ) : (
        <span className="min-w-0 truncate text-amana-neutral-500">{value || '-'}</span>
      )}
    </div>
  );
}

interface EmployeeDetailsModalProps {
  employee: EmployeeDetails;
  onClose: () => void;
  onRemove?: () => void;
  onEdit?: () => void;
  onViewAssessment?: () => void;
  onViewCertificate?: (cert: EmployeeCertificate) => void;
  onViewCareerHistory?: () => void;
}

/** Content-only version (no Modal shell) — for embedding inside a persistent modal that
 * crossfades between view/edit content instead of unmounting the whole dialog. */
export function EmployeeDetailsContent({
  employee,
  onRemove,
  onEdit,
  onViewAssessment,
  onViewCertificate,
  onViewCareerHistory,
}: Omit<EmployeeDetailsModalProps, 'onClose'>) {
  // No Remove/Edit alongside (self-service profile view) means these View buttons
  // aren't competing with a stronger CTA, so they can be the plain solid blue button.
  const viewButtonVariant = onRemove || onEdit ? 'outline' : 'primary';

  return (
    <>
      <div className="flex-1 min-h-0 overflow-y-auto scroll-smooth p-5 flex flex-col lg:flex-row gap-4">
        <div className="w-full lg:w-2/5 flex-shrink-0 flex flex-col bg-amana-neutral-100 rounded-[5px] border border-amana-primary-500 px-4 py-3">
          <h3 className="flex-shrink-0 text-[18px] font-semibold text-amana-primary-500 pb-1.5 mb-3 border-b border-amana-primary-500">
            Bio
          </h3>
          <div className="flex justify-center mb-3">
            <div className="w-[120px] h-[120px] rounded-[8px] overflow-hidden border border-amana-primary-500 shadow-sm bg-amana-neutral-200 flex items-center justify-center flex-shrink-0">
              {employee.photoSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={employee.photoSrc} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[28px] font-semibold text-amana-primary-500">
                  {employee.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
                </span>
              )}
            </div>
          </div>
          <h4 className="flex-shrink-0 text-[15px] font-bold text-amana-neutral-500 pb-1 mb-1 border-b border-amana-neutral-300">
            Details
          </h4>
          <div className="flex flex-col">
            <DetailRow label="Name" value={employee.name} />
            <DetailRow label="PG" value={employee.department} />
            <DetailRow label="Grade" value={employee.grade} />
            <DetailRow label="Position" value={employee.position} />
            <DetailRow label="Contract" value={employee.contractType} />
            <DetailRow label="Email" value={employee.email} href={`mailto:${employee.email}`} />
            <DetailRow label="Phone" value={employee.phone} />
          </div>
          {(onRemove || onEdit) && (
            <>
              <div className="flex-1" />
              <div className="flex gap-2 mt-4">
                {onRemove && (
                  <Button variant="danger-outline" size="md" className="flex-1" onClick={onRemove}>
                    Remove
                  </Button>
                )}
                {onEdit && (
                  <Button variant="primary" size="md" className="flex-1" onClick={onEdit}>
                    Edit
                  </Button>
                )}
              </div>
            </>
          )}
        </div>

        <div className="w-full lg:w-3/5 flex-1 min-h-0 flex flex-col bg-amana-neutral-100 rounded-[5px] border border-amana-primary-500 px-4 py-3">
          <h3 className="flex-shrink-0 text-[18px] font-semibold text-amana-primary-500 pb-1.5 mb-3 border-b border-amana-primary-500">
            Assessement(s)
          </h3>
<div className="flex-shrink-0 flex items-center gap-[10px] pb-3 mb-3 border-b border-amana-neutral-300">
              <span className="flex-1 min-w-0 text-[16px] text-amana-neutral-500">{employee.assessmentName ?? 'Competency Assessment'}</span>
              {onViewAssessment && (
                <Button
                  variant={viewButtonVariant}
                  size="sm"
                  className="w-[224px] flex-shrink-0"
                  onClick={onViewAssessment}
                >
                  View
                </Button>
              )}
            </div>

          {onViewCareerHistory && (
            <>
              <h4 className="flex-shrink-0 text-[18px] font-semibold not-italic text-amana-primary-500 pb-1.5 mb-3 border-b border-amana-primary-500">
                Career History
              </h4>
              <div className="flex-shrink-0 pb-3 mb-3 border-b border-amana-neutral-300">
                <Button variant={viewButtonVariant} size="sm" className="w-full" onClick={onViewCareerHistory}>
                  View
                </Button>
              </div>
            </>
          )}

          <h4 className="flex-shrink-0 text-[18px] font-semibold not-italic text-amana-primary-500 pb-1.5 mb-3 border-b border-amana-primary-500">
            Certificates
          </h4>
          <div className="flex-1 min-h-0 overflow-y-auto scroll-smooth flex flex-col gap-2.5">
            {employee.certificates.length > 0 ? (
              employee.certificates.map((cert, i) => (
                <div key={i} className="flex items-center gap-[10px]">
                  <span className="flex-1 min-w-0 text-[15px] text-amana-neutral-500">{cert.title}</span>
                  <Button
                    variant={viewButtonVariant}
                    size="sm"
                    className="w-[224px] flex-shrink-0"
                    disabled={!cert.fileURL}
                    onClick={() => onViewCertificate?.(cert)}
                  >
                    View
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-[14px] text-amana-neutral-400">No certificates uploaded.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default function EmployeeDetailsModal({ employee, onClose, onRemove, onEdit, onViewAssessment, onViewCertificate, onViewCareerHistory }: EmployeeDetailsModalProps) {
  return (
    <Modal title="Employee Details" onClose={onClose} maxWidth="max-w-4xl" className="max-h-[90vh]">
      <EmployeeDetailsContent
        employee={employee}
        onRemove={onRemove}
        onEdit={onEdit}
        onViewAssessment={onViewAssessment}
        onViewCertificate={onViewCertificate}
        onViewCareerHistory={onViewCareerHistory}
      />
    </Modal>
  );
}
