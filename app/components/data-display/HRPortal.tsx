'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Check, Inbox, Link2, Pencil, Trash2 } from 'lucide-react';
import Button from '../forms/Button';
import Modal from '../feedback/Modal';
import ConfirmModal from '../feedback/ConfirmModal';
import StatusModal, { type StatusState } from '../feedback/StatusModal';
import TextField from '../forms/TextField';
import SelectField from '../forms/SelectField';
import { SearchTextField, SearchDateRangeCalendarField } from '../forms/SearchFields';
import {
  useHrPortal,
  type HrPortalItem,
  type HrPortalCreatePayload,
  type ActionResult,
} from '@/lib/useHrPortal';
import { DEPARTMENT_LABELS } from '@/lib/constants';
import { formatDateWIB } from '@/app/utils/formatDate';
import { cn } from '@/app/utils/cn';

interface RecipientOption {
  idKaryawan: string;
  nama: string;
  department: string | null;
  roleLabel: string;
}

const DEPT_OPTIONS = ['', ...Object.keys(DEPARTMENT_LABELS)];
const DEPT_LABELS: Record<string, string> = { '': 'All', ...DEPARTMENT_LABELS };

// Deteksi URL di dalam pesan → link yang bisa diklik (buka tab baru).
// Tanda bacaan nyangkut di akhir URL (mis. "cek https://x.com.") dipotong dari href.
function renderLinks(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const re = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const raw = m[0].replace(/[.,;:!?]+$/, '');
    const tail = m[0].slice(raw.length);
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (raw) {
      const href = /^www\./i.test(raw) ? `https://${raw}` : raw;
      nodes.push(
        <a
          key={`link-${key++}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-amana-primary-500 underline underline-offset-2 break-all"
        >
          {raw}
        </a>
      );
    }
    if (tail) nodes.push(tail);
    last = m.index + m[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

// ---------------------------------------------------------------- compose modal
function HRPortalComposeModal({
  onClose,
  onPublish,
  onUpdate,
  onStatus,
  initialItem,
  initialRecipientIds,
}: {
  onClose: () => void;
  onPublish?: (payload: HrPortalCreatePayload) => Promise<ActionResult>;
  onUpdate?: (idMading: string, payload: HrPortalCreatePayload) => Promise<ActionResult>;
  onStatus: (state: StatusState) => void;
  /** Ada → mode edit (judul/pesan/periode/audience prefilled). */
  initialItem?: HrPortalItem;
  /** Prefill checkbox penerima saat mode edit Targeted. */
  initialRecipientIds?: string[];
}) {
  const editing = !!initialItem;
  const [judul, setJudul] = useState(initialItem?.judul ?? '');
  const [pesan, setPesan] = useState(initialItem?.pesan ?? '');
  const [link, setLink] = useState(initialItem?.link ?? '');
  const [startDate, setStartDate] = useState(initialItem?.tanggalMulai?.slice(0, 10) ?? '');
  const [endDate, setEndDate] = useState(initialItem?.tanggalSelesai?.slice(0, 10) ?? '');
  const [audience, setAudience] = useState<'ALL' | 'TARGETED'>(initialItem?.audience ?? 'ALL');
  const [dept, setDept] = useState('');
  const [q, setQ] = useState('');
  const [recipients, setRecipients] = useState<RecipientOption[]>([]);
  const [fetching, setFetching] = useState(false);
  const [selected, setSelected] = useState<string[]>(initialRecipientIds ?? []);
  const [publishing, setPublishing] = useState(false);

  // Picker penerima: fetch saat mode Targeted + saat filter q/dept berubah (debounce 300ms).
  useEffect(() => {
    if (audience !== 'TARGETED') return;
    const t = setTimeout(async () => {
      try {
        setFetching(true);
        const params = new URLSearchParams();
        if (q.trim()) params.set('q', q.trim());
        if (dept) params.set('department', dept);
        const res = await fetch(`/api/hrportal/recipients?${params.toString()}`, { cache: 'no-store' });
        if (res.ok) {
          const data = (await res.json()) as { list?: RecipientOption[] };
          setRecipients(data.list ?? []);
        }
      } catch {
        setRecipients([]);
      } finally {
        setFetching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [audience, q, dept]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const publishDisabled =
    (audience === 'TARGETED' && selected.length === 0) || (!judul.trim() && !pesan.trim());

  const publish = async () => {
    setPublishing(true);
    const payload: HrPortalCreatePayload = {
      judul: judul.trim(),
      pesan: pesan.trim(),
      link: link.trim() || null,
      audience,
      tanggalMulai: startDate || null,
      tanggalSelesai: endDate || null,
      recipientIds: audience === 'TARGETED' ? selected : [],
    };
    const r =
      editing && onUpdate && initialItem
        ? await onUpdate(initialItem.idMading, payload)
        : await onPublish!(payload);
    setPublishing(false);
    if (r.ok) {
      onStatus({ ok: true, text: editing ? 'Announcement updated.' : 'Announcement published.' });
      onClose();
    } else {
      onStatus({
        ok: false,
        text: r.error ?? (editing ? 'Failed to update announcement' : 'Failed to publish announcement'),
      });
    }
  };

  return (
    <Modal
      title={editing ? 'Edit Announcement' : 'Create Announcement'}
      onClose={onClose}
      maxWidth="max-w-2xl"
      className="max-h-[85vh]"
    >
      <div className="flex-1 min-h-0 overflow-y-auto p-5 flex flex-col gap-4">
        <TextField label="Title" value={judul} onChange={setJudul} placeholder="Announcement title" />
        <div className="flex flex-col gap-1.5">
          <label className="text-[16px] font-semibold text-amana-neutral-500">Message</label>
          <textarea
            value={pesan}
            onChange={(e) => setPesan(e.target.value)}
            rows={4}
            placeholder="Write the announcement message..."
            className="w-full border border-amana-neutral-300 rounded-[8px] px-3 py-2.5 text-[16px] text-amana-neutral-500 placeholder:text-amana-neutral-300 transition-colors duration-200 focus:outline-none focus:border-amana-primary-500 resize-y"
          />
        </div>

        <TextField
          label="Link (optional)"
          value={link}
          onChange={setLink}
          placeholder="https://..."
        />

        <SearchDateRangeCalendarField
          label="Period (optional)"
          fromValue={startDate}
          toValue={endDate}
          onFromChange={setStartDate}
          onToChange={setEndDate}
        />

        <div className="flex flex-col gap-2">
          <span className="text-[16px] font-semibold text-amana-neutral-500">Audience</span>
          <label className="flex items-center gap-2 text-[16px] text-amana-neutral-500 cursor-pointer">
            <input
              type="radio"
              name="hrportal-audience"
              checked={audience === 'ALL'}
              onChange={() => setAudience('ALL')}
              className="accent-amana-primary-500"
            />
            Send to all
          </label>
          <label className="flex items-center gap-2 text-[16px] text-amana-neutral-500 cursor-pointer">
            <input
              type="radio"
              name="hrportal-audience"
              checked={audience === 'TARGETED'}
              onChange={() => setAudience('TARGETED')}
              className="accent-amana-primary-500"
            />
            Targeted
          </label>

          {audience === 'TARGETED' && (
            <div className="flex flex-col gap-3 pl-6 border-l-2 border-amana-neutral-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <SelectField
                  label="Department"
                  value={dept}
                  onChange={setDept}
                  options={DEPT_OPTIONS}
                  labels={DEPT_LABELS}
                  placeholder="All"
                />
                <SearchTextField label="Search" value={q} onChange={setQ} placeholder="Search by name..." />
              </div>
              <div className="max-h-[180px] overflow-y-auto border border-amana-neutral-200 rounded-[8px] p-1.5 flex flex-col gap-0.5">
                {fetching ? (
                  <p className="px-2 py-2 text-[14px] text-amana-neutral-400">Loading...</p>
                ) : recipients.length === 0 ? (
                  <p className="px-2 py-2 text-[14px] text-amana-neutral-400">No recipients found.</p>
                ) : (
                  recipients.map((r) => {
                    const active = selected.includes(r.idKaryawan);
                    return (
                      <button
                        key={r.idKaryawan}
                        type="button"
                        onClick={() => toggleSelect(r.idKaryawan)}
                        className={cn(
                          'w-full text-left flex items-center gap-2 px-2 py-1.5 rounded text-[14px] transition-colors',
                          active ? 'bg-amana-primary-500 text-white' : 'text-amana-neutral-500 hover:bg-amana-primary-100'
                        )}
                      >
                        <span
                          className={cn(
                            'w-4 h-4 rounded-[4px] border flex items-center justify-center flex-shrink-0',
                            active ? 'bg-white border-white' : 'border-amana-neutral-300'
                          )}
                        >
                          {active && <Check className="w-3 h-3 text-amana-primary-500" strokeWidth={4} />}
                        </span>
                        <span className="truncate">
                          {r.nama} ({r.roleLabel}
                          {r.department ? `, ${DEPARTMENT_LABELS[r.department] ?? r.department}` : ''})
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
              <p className="text-[12px] text-amana-neutral-400">{selected.length} recipient(s) selected</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex-shrink-0 flex justify-end gap-3 px-5 py-3 border-t border-amana-neutral-200">
        <Button variant="outline" size="md" onClick={onClose} disabled={publishing}>
          Cancel
        </Button>
        <Button variant="primary" size="md" onClick={() => void publish()} disabled={publishDisabled} isLoading={publishing}>
          {editing ? 'Save Changes' : 'Publish'}
        </Button>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------- view detail
function HRPortalViewModal({ item, onClose }: { item: HrPortalItem; onClose: () => void }) {
  const range =
    item.tanggalMulai && item.tanggalSelesai
      ? `${formatDateWIB(item.tanggalMulai)} – ${formatDateWIB(item.tanggalSelesai)}`
      : item.tanggalMulai
        ? formatDateWIB(item.tanggalMulai)
        : item.tanggalSelesai
          ? formatDateWIB(item.tanggalSelesai)
          : formatDateWIB(item.createdAt);

  return (
    <Modal title={item.judul || 'Announcement'} onClose={onClose} maxWidth="max-w-xl" className="max-h-[80vh]">
      <div className="flex-1 min-h-0 overflow-y-auto p-5 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2 text-[12px] text-amana-neutral-400">
          <span>{range}</span>
          <span>·</span>
          <span>{item.audience === 'TARGETED' ? 'Targeted' : 'Send to all'}</span>
          {item.isDone && item.doneAt && (
            <>
              <span>·</span>
              <span className="text-amana-success-500 font-semibold">Done ✓ · {formatDateWIB(item.doneAt)}</span>
            </>
          )}
        </div>
        <p className="text-[16px] leading-relaxed text-amana-neutral-500 whitespace-pre-wrap">
          {renderLinks(item.pesan || item.judul || '-')}
        </p>
        {item.link && (
          <>
            <div className="border-t border-amana-neutral-200" />
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-[15px] text-amana-primary-500 underline underline-offset-2 break-all"
            >
              <Link2 className="w-4 h-4 flex-shrink-0" />
              {item.link}
            </a>
          </>
        )}
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------- feed panel
export function HRPortalFeed() {
  const { list, unread, canManage, markRead, toggleDone, remove, create, update, loadArchive } = useHrPortal();
  const [composeOpen, setComposeOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<HrPortalItem | null>(null);
  const [editIds, setEditIds] = useState<string[]>([]);
  const [viewItem, setViewItem] = useState<HrPortalItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HrPortalItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [status, setStatus] = useState<StatusState | null>(null);

  const openView = (item: HrPortalItem) => {
    setViewItem(item);
    if (!item.isRead && !item.isAuthor) void markRead(item.idMading);
  };

  // Buka modal edit — untuk Targeted, ambil recipientIds dulu supaya prefill
  // sudah siap saat modal mounted (useState hanya membaca initial sekali).
  const openEdit = async (item: HrPortalItem) => {
    let ids: string[] = [];
    if (item.audience === 'TARGETED') {
      try {
        const res = await fetch(`/api/hrportal/${item.idMading}`, { cache: 'no-store' });
        if (res.ok) {
          const data = (await res.json()) as { recipientIds?: string[] };
          ids = data.recipientIds ?? [];
        }
      } catch {}
    }
    setEditIds(ids);
    setEditTarget(item);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const r = await remove(deleteTarget.idMading);
    setDeleting(false);
    setDeleteTarget(null);
    if (r.ok) setStatus({ ok: true, text: 'Announcement deleted.' });
    else setStatus({ ok: false, text: r.error ?? 'Failed to delete announcement' });
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-amana-neutral-100 rounded-[5px] border border-amana-primary-500 shadow-sm px-4 py-2.5">
      <h3 className="flex-shrink-0 flex items-center justify-between gap-3 text-[20px] font-semibold text-amana-primary-500 pb-1.5 mb-1.5 border-b border-amana-primary-500">
        <span className="flex items-center gap-2 min-w-0">
          <span>HR Portal</span>
          {unread > 0 && (
            <span className="text-[13px] font-normal text-amana-primary-500">🔵 {unread} unread</span>
          )}
        </span>
        {canManage && (
          <Button variant="primary" size="sm" className="flex-shrink-0" onClick={() => setComposeOpen(true)}>
            Add Announcement
          </Button>
        )}
      </h3>

      <div className="flex-1 min-h-0 overflow-y-auto scroll-smooth py-1.5 flex flex-col gap-2">
        {list.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-center py-4">
            <Inbox className="w-9 h-9 text-amana-primary-300" strokeWidth={1.5} />
            <p className="text-[14px] text-amana-neutral-400">No announcements yet.</p>
          </div>
        ) : (
          list.map((item) => {
            const expired = !!item.tanggalSelesai && new Date(item.tanggalSelesai) < new Date();
            const struck = expired;
            const range =
              item.tanggalMulai && item.tanggalSelesai
                ? `${formatDateWIB(item.tanggalMulai)} – ${formatDateWIB(item.tanggalSelesai)}`
                : item.tanggalMulai
                  ? formatDateWIB(item.tanggalMulai)
                  : item.tanggalSelesai
                    ? formatDateWIB(item.tanggalSelesai)
                    : formatDateWIB(item.createdAt);
            const meta = range;
            const unreadDot = !item.isRead && !item.isAuthor;

            return (
              <div
                key={item.idMading}
                onClick={() => openView(item)}
                className="border border-amana-primary-500 rounded-[8px] px-3 py-2 bg-white cursor-pointer flex flex-col gap-0.5"
              >
                <div className="flex items-start gap-2">
                  <p className={cn('flex-1 text-[16px] font-semibold text-amana-neutral-500 break-words', struck && 'italic line-through')}>
                    {item.judul || (item.pesan ? item.pesan.slice(0, 80) : 'Announcement')}
                  </p>
                  {unreadDot && (
                    <span className="flex-shrink-0 flex items-center gap-1 text-[11px] font-semibold text-amana-primary-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-amana-primary-500" />
                      New
                    </span>
                  )}
                </div>
                {item.pesan && (
                  <>
                    <div className="border-t border-amana-neutral-200 mt-1" />
                    <p className="text-[14px] text-amana-neutral-400 line-clamp-3 whitespace-pre-wrap">{renderLinks(item.pesan)}</p>
                  </>
                )}
                {item.link && (
                  <>
                    <div className="border-t border-amana-neutral-200 mt-1" />
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1.5 text-[14px] text-amana-primary-500 underline underline-offset-2 break-all"
                    >
                      <Link2 className="w-3.5 h-3.5 flex-shrink-0" />
                      {item.link}
                    </a>
                  </>
                )}
                <div className="flex items-center justify-between gap-2 mt-1.5">
                  <span className={cn('text-[12px] text-amana-neutral-400', struck && 'italic line-through')}>
                    {meta}
                  </span>
                  <span className="flex justify-end gap-2 flex-shrink-0">
                    {!item.isAuthor && (
                      <button
                        type="button"
                        aria-label="Mark as done"
                        onClick={(e) => {
                          e.stopPropagation();
                          void (async () => {
                            const r = await toggleDone(item.idMading, true);
                            if (r.ok) {
                              setStatus({ ok: true, text: `"${item.judul || 'Announcement'}" moved to archive.` });
                            } else {
                              setStatus({ ok: false, text: r.error ?? 'Failed to move announcement to archive' });
                            }
                          })();
                        }}
                        className="w-7 h-7 rounded-[6px] border border-amana-neutral-300 text-amana-neutral-400 flex items-center justify-center transition-colors hover:border-amana-primary-500 hover:text-amana-primary-500"
                      >
                        <Check className="w-4 h-4" strokeWidth={3} />
                      </button>
                    )}
                    {item.isAuthor && (
                      <>
                        <button
                          type="button"
                          aria-label="Edit announcement"
                          onClick={(e) => {
                            e.stopPropagation();
                            void openEdit(item);
                          }}
                          className="w-7 h-7 rounded-[6px] border border-amana-neutral-300 text-amana-neutral-400 flex items-center justify-center transition-colors hover:border-amana-primary-500 hover:text-amana-primary-500"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          aria-label="Delete announcement"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(item);
                          }}
                          className="w-7 h-7 rounded-[6px] border border-amana-neutral-300 text-amana-neutral-400 flex items-center justify-center transition-colors hover:border-amana-danger-500 hover:text-amana-danger-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="flex-shrink-0 pt-2">
        <Button variant="outline" size="md" className="w-full" onClick={() => setArchiveOpen(true)}>
          View Archive Announcement
        </Button>
      </div>

      {composeOpen && (
        <HRPortalComposeModal
          onClose={() => setComposeOpen(false)}
          onPublish={create}
          onStatus={setStatus}
        />
      )}

      {editTarget && (
        <HRPortalComposeModal
          onClose={() => setEditTarget(null)}
          onUpdate={update}
          onStatus={setStatus}
          initialItem={editTarget}
          initialRecipientIds={editIds}
        />
      )}

      {archiveOpen && (
        <HRPortalArchiveModal
          onClose={() => setArchiveOpen(false)}
          onToggle={toggleDone}
          onStatus={setStatus}
          loadArchive={loadArchive}
        />
      )}

      {viewItem && <HRPortalViewModal item={viewItem} onClose={() => setViewItem(null)} />}

      {deleteTarget && (
        <ConfirmModal
          title="Delete Announcement"
          message={`Delete "${deleteTarget.judul || 'this announcement'}" permanently? This cannot be undone.`}
          confirmLabel="Delete"
          loadingLabel="Deleting..."
          loading={deleting}
          onConfirm={() => void confirmDelete()}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <StatusModal state={status} onClose={() => setStatus(null)} />
    </div>
  );
}

// ---------------------------------------------------------------- archive modal
function HRPortalArchiveModal({
  onClose,
  onToggle,
  onStatus,
  loadArchive,
}: {
  onClose: () => void;
  onToggle: (id: string, done: boolean) => Promise<ActionResult>;
  onStatus: (s: StatusState) => void;
  loadArchive: () => Promise<HrPortalItem[]>;
}) {
  const [items, setItems] = useState<HrPortalItem[] | null>(null);
  const [viewItem, setViewItem] = useState<HrPortalItem | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = async () => setItems(await loadArchive());
  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const uncheck = async (item: HrPortalItem) => {
    setBusyId(item.idMading);
    const r = await onToggle(item.idMading, false);
    setBusyId(null);
    if (r.ok) {
      onStatus({ ok: true, text: `"${item.judul || 'Announcement'}" restored to feed.` });
      await refresh();
    } else {
      onStatus({ ok: false, text: r.error ?? 'Failed to restore announcement' });
    }
  };

  return (
    <Modal title="Archive Announcement" onClose={onClose} maxWidth="max-w-xl" className="max-h-[80vh]">
      <div className="flex-1 min-h-0 overflow-y-auto p-5 flex flex-col gap-3">
        {items === null ? (
          <p className="text-center text-[14px] text-amana-neutral-400 py-6">Loading...</p>
        ) : items.length === 0 ? (
          <p className="text-center text-[14px] text-amana-neutral-400 py-6">No archived announcements.</p>
        ) : (
          items.map((item) => (
            <div
              key={item.idMading}
              onClick={() => setViewItem(item)}
              className="border border-amana-neutral-200 rounded-[8px] px-4 py-3 bg-amana-neutral-50 flex flex-col gap-1 cursor-pointer"
            >
              <p className="text-[16px] font-semibold text-amana-neutral-500 break-words">
                {item.judul || (item.pesan ? item.pesan.slice(0, 80) : 'Announcement')}
              </p>
              {item.pesan && (
                <>
                  <div className="border-t border-amana-neutral-200 mt-1" />
                  <p className="text-[14px] text-amana-neutral-400 whitespace-pre-wrap">{renderLinks(item.pesan)}</p>
                </>
              )}
              {item.link && (
                <>
                  <div className="border-t border-amana-neutral-200 mt-1" />
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1.5 text-[14px] text-amana-primary-500 underline underline-offset-2 break-all"
                  >
                    <Link2 className="w-3.5 h-3.5 flex-shrink-0" />
                    {item.link}
                  </a>
                </>
              )}
              <div className="flex items-center justify-between gap-2 mt-1.5">
                <span className="text-[12px] text-amana-neutral-400">
                  {item.doneAt ? `Done ✓ · ${formatDateWIB(item.doneAt)}` : 'Done ✓'}
                </span>
                <span className="flex gap-2 flex-shrink-0">
                  <button
                    type="button"
                    aria-label="Uncheck done"
                    disabled={busyId === item.idMading}
                    onClick={(e) => {
                      e.stopPropagation();
                      void uncheck(item);
                    }}
                    className="w-7 h-7 rounded-[6px] border flex items-center justify-center transition-colors bg-amana-primary-500 border-amana-primary-500 text-white disabled:opacity-60"
                  >
                    <Check className="w-4 h-4" strokeWidth={3} />
                  </button>
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {viewItem && <HRPortalViewModal item={viewItem} onClose={() => setViewItem(null)} />}
    </Modal>
  );
}

export default HRPortalFeed;
