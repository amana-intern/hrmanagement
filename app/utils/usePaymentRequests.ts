'use client';

import { useEffect, useMemo, useState } from 'react';
import { useFilters } from './useFilters';
import { mapPaymentRows, paymentStatusLabel, type PayReq, type PaymentRaw } from './payment';
import type { StatusState } from '@/app/components/feedback/StatusModal';

interface Filters {
  search: string;
  status: string;
}

const emptyFilters: Filters = { search: '', status: '' };

/**
 * Shared data-fetch + search-filter + approval-action state for the payment
 * request pages (OPS review, OPS scheduler, Partner final approval) — the
 * three pages differ only in `scope` and which actions/columns they render.
 */
export function usePaymentRequests(scope: 'pending' | 'schedule' | 'partner') {
  const [requests, setRequests] = useState<PayReq[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<StatusState | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { draft, applied, setField, handleSearch, handleReset } = useFilters<Filters>(emptyFilters);

  const load = async () => {
    const res = await fetch(`/api/payment/list?scope=${scope}`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      setRequests(mapPaymentRows((data.list ?? []) as PaymentRaw[]));
    } else {
      const data = await res.json().catch(() => null);
      setMessage({ ok: false, text: data?.error || 'Failed to load data' });
    }
  };

  useEffect(() => {
    (async () => {
      await load();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = applied.search.trim().toLowerCase();
    return requests.filter((r) => {
      const matchSearch =
        !q ||
        r.idRequest.toLowerCase().includes(q) ||
        r.user.toLowerCase().includes(q) ||
        r.projectID.toLowerCase().includes(q);
      const matchStatus = !applied.status || paymentStatusLabel(r.status) === applied.status;
      return matchSearch && matchStatus;
    });
  }, [requests, applied]);

  // PATCH one payment request; guards against double-submit by ignoring calls
  // while another action is already in flight. Returns whether it succeeded
  // so the caller can show its own success message text.
  const submitAction = async (id: string, action: string, extra?: Record<string, unknown>) => {
    if (processingId) return false;
    setProcessingId(id);
    try {
      const res = await fetch(`/api/payment/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extra }),
      });
      if (res.ok) {
        await load();
        return true;
      }
      const data = await res.json().catch(() => null);
      setMessage({ ok: false, text: data?.error || `Failed to process (${res.status})` });
      return false;
    } finally {
      setProcessingId(null);
    }
  };

  return {
    requests,
    loading,
    filtered,
    message,
    setMessage,
    processingId,
    submitAction,
    draft,
    applied,
    setField,
    handleSearch,
    handleReset,
  };
}
