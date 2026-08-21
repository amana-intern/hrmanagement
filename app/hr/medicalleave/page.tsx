'use client';

import { useEffect, useMemo, useState } from 'react';
import PageTopBar from '../../components/layout/PageTopBar';
import SearchPanel from '../../components/data-display/SearchPanel';
import SectionCard from '../../components/layout/SectionCard';
import DataTable from '../../components/data-display/DataTable';
import type { DataTableColumn } from '../../components/data-display/DataTable';
import { SearchTextField, SearchSelectField } from '../../components/forms/SearchFields';
import Button from '../../components/forms/Button';
import { useFilters } from '@/app/utils/useFilters';
import { formatDateTimeWIB } from '@/app/utils/formatDate';
import { DEPARTMENT_OPTIONS, getAllGradeOptions } from '@/app/utils/orgStructure';
import { downloadTSV, copyTSV } from '@/lib/sheets';
import { DEPARTMENT_LABEL } from '@/lib/roles';

interface SickLog {
  id: string;
  name: string;
  department: string;
  grade: string;
  startDate: string;
  endDate: string;
  submitted: string;
  submittedTs: number;
  duration: number;
  gejala: string;
  buktiSakitURL: string | null;
}

interface RawSick {
  idIzinSakit: string;
  karyawan?: { nama?: string | null; department?: string | null; masterGrade?: { namaGrade?: string | null } | null };
  tanggalMulai?: string | null;
  tanggalSelesai?: string | null;
  createdAt?: string | null;
  gejala?: string | null;
  buktiSakitURL?: string | null;
}

interface Filters {
  name: string;
  department: string;
  grade: string;
  gejala: string;
  duration: string;
}

const emptyFilters: Filters = { name: '', department: '', grade: '', gejala: '', duration: '' };
const durationOptions = ['<= 7 Days', '>= 7 Days'];
const diseaseBarColor = 'bg-amana-danger-400';

export default function MedicalLeavePage() {
  const [logs, setLogs] = useState<SickLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { draft, applied, setField, handleSearch, handleReset } = useFilters<Filters>(emptyFilters);
  const gradeOptions = useMemo(() => getAllGradeOptions(), []);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/sick', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setLogs(
          ((data as { list?: RawSick[] }).list ?? []).map((l) => {
            const startDate = l.tanggalMulai ? new Date(l.tanggalMulai).toISOString().slice(0, 10) : '';
            const endDate = l.tanggalSelesai ? new Date(l.tanggalSelesai).toISOString().slice(0, 10) : '';
            const duration =
              startDate && endDate
                ? Math.max(Math.round((new Date(endDate + 'T00:00:00').getTime() - new Date(startDate + 'T00:00:00').getTime()) / 86400000) + 1, 0)
                : 0;
            return {
              id: l.idIzinSakit,
              name: l.karyawan?.nama ?? '-',
              department:
                (l.karyawan?.department && DEPARTMENT_LABEL[l.karyawan.department]) || l.karyawan?.department || '-',
              grade: l.karyawan?.masterGrade?.namaGrade ?? '-',
              startDate,
              endDate,
              submitted: formatDateTimeWIB(l.createdAt ?? l.tanggalMulai),
              submittedTs: l.createdAt ? new Date(l.createdAt).getTime() : l.tanggalMulai ? new Date(l.tanggalMulai).getTime() : 0,
              duration,
              gejala: l.gejala ?? '-',
              buktiSakitURL: l.buktiSakitURL ?? null,
            };
          })
        );
      }
      setLoading(false);
    })();
  }, []);

  const gejalaOptions = useMemo(
    () => Array.from(new Set(logs.map((l) => (l.gejala === '-' ? 'Unknown' : l.gejala)).filter(Boolean))).sort(),
    [logs]
  );

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      if (applied.name && !l.name.toLowerCase().includes(applied.name.toLowerCase())) return false;
      if (applied.department && l.department !== applied.department) return false;
      if (applied.grade && l.grade !== applied.grade) return false;
      const g = l.gejala === '-' ? 'Unknown' : l.gejala;
      if (applied.gejala && g !== applied.gejala) return false;
      if (applied.duration) {
        if (applied.duration === '<= 7 Days' && l.duration > 7) return false;
        if (applied.duration === '>= 7 Days' && l.duration < 7) return false;
      }
      return true;
    });
  }, [logs, applied]);

  const diseaseCounts = useMemo(() => {
    const counts = new Map<string, number>();
    logs.forEach((l) => {
      const key = l.gejala === '-' ? 'Unknown' : l.gejala;
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    const entries = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
    const max = entries[0]?.[1] || 1;
    return entries.map(([disease, count]) => ({ disease, count, pct: (count / max) * 100 }));
  }, [logs]);

  const buildTSV = () => {
    const header = ['Name', 'Department', 'Grade', 'Start Date', 'End Date', 'Duration (days)', 'Diagnosis', 'Document'];
    const lines = filtered.map((l) => [
      l.name,
      l.department,
      l.grade,
      l.startDate,
      l.endDate,
      l.duration,
      l.gejala === '-' ? '' : l.gejala,
      l.buktiSakitURL ?? '',
    ]);
    return [header, ...lines];
  };

  const handleExportCsv = () => {
    downloadTSV(`medical-leave_${new Date().toISOString().slice(0, 10)}.tsv`, buildTSV());
  };

  const handleCopySheets = async () => {
    const ok = await copyTSV(buildTSV());
    alert(ok ? 'Copied to clipboard. Paste into Google Sheets (Ctrl+V).' : 'Failed to copy to clipboard.');
  };

  const columns: DataTableColumn<SickLog>[] = [
    {
      key: 'submitted',
      label: 'Submitted',
      sortValue: (r) => r.submittedTs,
    },
    { key: 'name', label: 'Name', width: '200px' },
    { key: 'department', label: 'Department' },
    { key: 'grade', label: 'Grade' },
    { key: 'duration', label: 'Duration', render: (r) => `${r.duration} Day(s)` },
    { key: 'gejala', label: 'Sickness Type' },
    {
      key: 'id',
      label: 'Document',
      render: (r) =>
        r.buktiSakitURL ? (
          <Button variant="primary" size="sm" className="w-full" onClick={() => window.open(r.buktiSakitURL!, '_blank')}>
            View
          </Button>
        ) : (
          <span className="block text-center text-[14px] text-amana-neutral-400 italic">No file</span>
        ),
    },
  ];

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="w-full h-full flex flex-col gap-3">
      <PageTopBar showGreeting section="Attendance" page="Medical Leave Record" />

      <SearchPanel
        title="Filter Sick Leave Record"
        subtitle="Filter employee sick leaves based on employee, department, grade, sickness type, and duration."
        onReset={handleReset}
        onSearch={handleSearch}
      >
        <SearchTextField label="Employee Name" value={draft.name} onChange={(v) => setField('name', v)} placeholder="Search by name..." />
        <SearchSelectField label="Department" value={draft.department} onChange={(v) => setField('department', v)} options={DEPARTMENT_OPTIONS} />
        <SearchSelectField label="Grade" value={draft.grade} onChange={(v) => setField('grade', v)} options={gradeOptions} />
        <SearchSelectField label="Sickness Type" value={draft.gejala} onChange={(v) => setField('gejala', v)} options={gejalaOptions} />
        <SearchSelectField label="Duration" value={draft.duration} onChange={(v) => setField('duration', v)} options={durationOptions} />
      </SearchPanel>

      <SectionCard title="Sick Leave Record" subtitle={`${filtered.length} record(s)`} scroll>
        <DataTable
          columns={columns}
          rows={filtered}
          defaultSortKey="name"
          emptyMessage="No sick leave records match your filters."
        />
      </SectionCard>

      <div className="flex-shrink-0 grid grid-cols-1 lg:grid-cols-2 gap-3">
        <SectionCard title="Frequent Diseases" scroll className="h-[260px]">
          <div className="flex-1 min-h-0 overflow-y-auto scroll-smooth flex flex-col justify-center gap-3 py-2 pr-2">
            {diseaseCounts.map(({ disease, count, pct }) => (
              <div key={disease} className="flex items-center gap-3">
                <span className="text-[16px] font-semibold text-amana-neutral-500 w-16 flex-shrink-0 truncate">{disease}</span>
                <div className="flex-1 h-4 bg-amana-neutral-200 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${diseaseBarColor}`} style={{ width: `${pct}%` }} />
                </div>
                <span className="text-[16px] font-semibold text-amana-neutral-500 w-5 text-right flex-shrink-0">{count}</span>
              </div>
            ))}
            {diseaseCounts.length === 0 && (
              <p className="text-[14px] text-amana-neutral-400 text-center">No data available</p>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Export Data" scroll className="h-[260px]">
          <p className="text-[14px] text-amana-neutral-400">
            Export leave data as TSV ready to upload to Google Spreadsheet.
          </p>
          <div className="flex-1" />
          <div className="flex justify-end gap-3 pt-2 flex-shrink-0">
            <Button variant="primary" size="md" onClick={handleExportCsv} disabled={filtered.length === 0}>
              Download TSV
            </Button>
            <Button variant="primary" size="md" onClick={handleCopySheets} disabled={filtered.length === 0}>
              Copy for Sheets
            </Button>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}