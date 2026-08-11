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

export interface EmployeeDetails {
  name: string;
  grade: string;
  department: string;
  email: string;
  phone: string;
  photoSrc?: string;
  assessmentDone: boolean;
  certificates: string[];
}

interface EmployeeDetailsModalProps {
  employee: EmployeeDetails;
  onClose: () => void;
  onRemove?: () => void;
}

export default function EmployeeDetailsModal({ employee, onClose, onRemove }: EmployeeDetailsModalProps) {
  return (
    <Modal title="Employee Details" onClose={onClose} maxWidth="max-w-4xl" className="max-h-[90vh]">
      <div className="flex-1 min-h-0 overflow-y-auto scroll-smooth p-5 flex flex-col lg:flex-row gap-4">
        <div className="w-full lg:w-2/5 flex-shrink-0 flex flex-col bg-amana-neutral-100 rounded-[8px] border border-amana-primary-500 px-4 py-3">
          <h3 className="flex-shrink-0 text-[18px] font-semibold text-amana-primary-500 pb-1.5 mb-3 border-b border-amana-primary-500">
            Bio
          </h3>
          <div className="flex flex-col items-center text-center gap-1">
            <div className="w-[120px] h-[120px] rounded-[8px] overflow-hidden border border-amana-primary-500 shadow-sm bg-amana-neutral-200 flex items-center justify-center mb-3">
              {employee.photoSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={employee.photoSrc} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[28px] font-semibold text-amana-primary-500">
                  {employee.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
                </span>
              )}
            </div>
            <p className="text-[18px] font-semibold text-amana-neutral-500">{employee.name}</p>
            <p className="text-[15px] text-amana-neutral-500">{employee.grade}</p>
            <p className="text-[15px] text-amana-neutral-500">{employee.department}</p>
            <a href={`mailto:${employee.email}`} className="text-[15px] text-amana-primary-500 hover:underline">
              {employee.email}
            </a>
            <p className="text-[15px] text-amana-neutral-500">{employee.phone}</p>
          </div>
          {onRemove && (
            <>
              <div className="flex-1" />
              <Button variant="danger" size="md" className="mt-4 w-full" onClick={onRemove}>
                Remove Talent
              </Button>
            </>
          )}
        </div>

        <div className="w-full lg:w-3/5 flex-1 min-h-0 flex flex-col bg-amana-neutral-100 rounded-[8px] border border-amana-primary-500 px-4 py-3">
          <h3 className="flex-shrink-0 text-[18px] font-semibold text-amana-primary-500 pb-1.5 mb-3 border-b border-amana-primary-500">
            Assessment Status
          </h3>
          <div className="flex-shrink-0 flex items-center justify-between pb-3 mb-3 border-b border-amana-neutral-300">
            <span className="text-[16px] text-amana-neutral-500">Competency Assessment</span>
            <AssessmentBadge done={employee.assessmentDone} />
          </div>

          <h4 className="flex-shrink-0 text-[16px] font-semibold text-amana-primary-500 mb-2">Certificates</h4>
          <div className="flex-1 min-h-0 overflow-y-auto scroll-smooth flex flex-col gap-2.5">
            {employee.certificates.length > 0 ? (
              employee.certificates.map((cert, i) => (
                <div key={i} className="flex items-center justify-between gap-3">
                  <span className="text-[15px] text-amana-neutral-500">{cert}</span>
                  <Button variant="primary" size="sm" className="flex-shrink-0">
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
    </Modal>
  );
}
