'use client';

import { useState } from 'react';

/**
 * Draft/applied filter-state management shared by the search-panel pages
 * (leave approval, payment request/scheduler, etc.): each field has its own
 * draft value, changes only take effect on "Search", and "Reset" clears both.
 */
export function useFilters<F extends object>(emptyFilters: F) {
  const [draft, setDraft] = useState<F>(emptyFilters);
  const [applied, setApplied] = useState<F>(emptyFilters);

  const setField = <K extends keyof F>(key: K, value: F[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handleSearch = () => setApplied(draft);

  const handleReset = () => {
    setDraft(emptyFilters);
    setApplied(emptyFilters);
  };

  return { draft, applied, setDraft, setField, handleSearch, handleReset };
}
