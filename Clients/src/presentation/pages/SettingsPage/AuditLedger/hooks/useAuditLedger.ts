import { useState, useEffect, useCallback } from "react";
import {
  getAuditLedger,
  verifyAuditLedger,
  type AuditLedgerEntry,
  type VerifyResult,
} from "../../../../../application/repository/auditLedger.repository";

const PAGE_SIZE = 50;

interface Filters {
  entity_type: string;
  entry_type: string;
  searchUser: string;
}

export function useAuditLedger() {
  const [entries, setEntries] = useState<AuditLedgerEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [filters, setFilters] = useState<Filters>({
    entity_type: "",
    entry_type: "",
    searchUser: "",
  });

  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const fetchEntries = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = {
        limit: PAGE_SIZE,
        offset,
      };
      if (filters.entity_type) params.entity_type = filters.entity_type;
      if (filters.entry_type) params.entry_type = filters.entry_type;

      const data = await getAuditLedger(params);
      setEntries(data.entries);
      setTotal(data.total);
    } catch (error) {
      console.error("Failed to fetch audit ledger:", error);
      setEntries([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [offset, filters.entity_type, filters.entry_type]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Reset offset when filters change
  const updateFilters = useCallback((newFilters: Partial<Filters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setOffset(0);
  }, []);

  const verify = useCallback(async () => {
    setIsVerifying(true);
    try {
      const result = await verifyAuditLedger();
      setVerifyResult(result);
    } catch (error) {
      console.error("Failed to verify audit ledger:", error);
      // Don't report "compromised" on network errors — leave as unverified
      setVerifyResult(null);
    } finally {
      setIsVerifying(false);
    }
  }, []);

  const nextPage = useCallback(() => {
    if (offset + PAGE_SIZE < total) {
      setOffset((prev) => prev + PAGE_SIZE);
    }
  }, [offset, total]);

  const prevPage = useCallback(() => {
    if (offset > 0) {
      setOffset((prev) => Math.max(0, prev - PAGE_SIZE));
    }
  }, [offset]);

  // Client-side user name filter
  const filteredEntries = filters.searchUser
    ? entries.filter((e) => {
        const fullName = `${e.user_name ?? ""} ${e.user_surname ?? ""}`.toLowerCase();
        return fullName.includes(filters.searchUser.toLowerCase());
      })
    : entries;

  return {
    entries: filteredEntries,
    total,
    isLoading,
    filters,
    updateFilters,
    offset,
    pageSize: PAGE_SIZE,
    nextPage,
    prevPage,
    verify,
    verifyResult,
    isVerifying,
  };
}
