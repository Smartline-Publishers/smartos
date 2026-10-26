"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { listCurrentLegalDocuments, type LegalDocument } from "@/features/legal/api";

interface LegalDocumentsState {
  documents: LegalDocument[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

/**
 * Loads the currently published legal versions. Registration and invitation
 * acceptance must submit exactly these versions; the backend rejects stale or
 * missing acceptances independently of this hook.
 */
export function useLegalDocuments(): LegalDocumentsState {
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await listCurrentLegalDocuments();
      if (mounted.current) setDocuments(next);
    } catch {
      if (mounted.current) {
        setError("Could not load the current legal documents. Check your connection and try again.");
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void reload();
    return () => {
      mounted.current = false;
    };
  }, [reload]);

  return { documents, loading, error, reload };
}
