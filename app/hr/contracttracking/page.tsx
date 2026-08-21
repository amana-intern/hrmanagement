'use client';

import { useCallback, useEffect, useState } from 'react';
import ContractTrackingPage from '../../components/data-display/ContractTrackingPage';
import type { Contract } from '../../components/data-display/ContractTrackingPage';
import Button from '../../components/forms/Button';
import Modal from '../../components/feedback/Modal';
import SelectField from '../../components/forms/SelectField';
import TextField from '../../components/forms/TextField';

interface ServerContract {
  idKaryawan: string;
  nama: string | null;
  grade: string | null;
  department: string | null;
  tipeKontrak: string | null;
  startDate: string | null;
  endDate: string | null;
  daysLeft: number | null;
}

const DEPARTMENT_LABELS: Record<string, string> = {
  health: 'Health & Wellbeing',
  digital: 'Digital & Finance',
  education: 'Education & HR',
  ops: 'Operations',
};

export default function HRContractTrackingPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [selectedKaryawan, setSelectedKaryawan] = useState('');
  const [tanggalMulai, setTanggalMulai] = useState('');
  const [tanggalBerakhir, setTanggalBerakhir] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const loadContracts = useCallback(async () => {
    const res = await fetch('/api/hr/contracts', { cache: 'no-store' });
    if (res.ok) {
      const body = (await res.json()) as { list?: ServerContract[] };
      setContracts(
        (body.list ?? []).map((c) => {
          const dept = (c.department && DEPARTMENT_LABELS[c.department]) || c.department || '-';
          return {
            id: c.idKaryawan,
            name: c.nama ?? '-',
            department: dept,
            grade: c.grade ?? '-',
            daysLeft: c.daysLeft ?? 0,
            startDate: c.startDate ? c.startDate.slice(0, 10) : '',
          };
        })
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    (async () => {
      await loadContracts();
    })();
  }, [loadContracts]);

  const karyawanOptions = contracts.map((c) => String(c.id));
  const karyawanLabels = Object.fromEntries(contracts.map((c) => [String(c.id), c.name]));

  const canSubmit =
    selectedKaryawan !== '' &&
    tanggalMulai !== '' &&
    tanggalBerakhir !== '' &&
    tanggalBerakhir >= tanggalMulai;

  const handleCreate = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setMessage(null);
    const res = await fetch('/api/hr/contracts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idKaryawan: selectedKaryawan, tanggalMulai, tanggalBerakhir }),
    });
    const data = await res.json().catch(() => null);
    setSubmitting(false);
    if (!res.ok) {
      setMessage({ ok: false, text: data?.error || 'Failed to create contract.' });
      return;
    }
    setMessage({ ok: true, text: 'Contract created / extended successfully. Leave carry-over has been calculated.' });
    setShowModal(false);
    setSelectedKaryawan('');
    setTanggalMulai('');
    setTanggalBerakhir('');
    await loadContracts();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <>
      <ContractTrackingPage
        contracts={contracts}
        showStartDate
        headerAction={
          <Button variant="primary" size="sm" onClick={() => setShowModal(true)} className="whitespace-nowrap">
            Add / Extend Contract
          </Button>
        }
      />

      {showModal && (
        <Modal title="Add / Extend Contract" onClose={() => setShowModal(false)} maxWidth="max-w-lg">
          <div className="px-5 py-4 flex flex-col gap-4 bg-amana-neutral-100">
            <SelectField
              label="Employee"
              value={selectedKaryawan}
              onChange={setSelectedKaryawan}
              options={karyawanOptions}
              labels={karyawanLabels}
              placeholder="Select employee..."
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField label="Contract Start" type="date" value={tanggalMulai} onChange={setTanggalMulai} />
              <TextField label="Contract End" type="date" value={tanggalBerakhir} onChange={setTanggalBerakhir} />
            </div>
            <p className="text-xs text-amana-neutral-400">
              Creates a new contract (addendum/renewal) for the selected employee. Leave carry-over is calculated automatically (n/2).
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleCreate} disabled={!canSubmit || submitting}>
                {submitting ? 'Creating...' : 'Create Contract'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {message && (
        <Modal title={message.ok ? 'Success' : 'Failed'} onClose={() => setMessage(null)} maxWidth="max-w-md">
          <div className="px-5 py-4 flex flex-col gap-3 bg-amana-neutral-100">
            <p className="text-[15px] text-amana-neutral-500">{message.text}</p>
            <Button variant="primary" onClick={() => setMessage(null)}>
              Close
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}