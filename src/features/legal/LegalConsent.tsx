"use client";

import Link from "next/link";
import { ArrowSquareOut } from "@phosphor-icons/react";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/cn";
import {
  documentByCode,
  type LegalDocument,
  type LegalDocumentCode,
} from "@/features/legal/api";

export interface LegalConsentProps {
  documents: LegalDocument[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  acceptedTerms: boolean;
  acceptedPrivacy: boolean;
  onChange: (next: { terms: boolean; privacy: boolean }) => void;
  errorMessage?: string | null;
  className?: string;
}

interface ConsentRowProps {
  code: LegalDocumentCode;
  document: LegalDocument | undefined;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  id: string;
}

function ConsentRow({ code, document, checked, onChange, label, id }: ConsentRowProps) {
  const href = `/legal?doc=${code === "TERMS_OF_SERVICE" ? "terms" : "privacy"}`;
  return (
    <div className="flex items-start gap-3 rounded-xl border border-line bg-slate-50/60 p-3 dark:border-neutral-800 dark:bg-neutral-900/60">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        required
        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:accent-brand-400"
      />
      <div className="min-w-0 text-[13px] leading-relaxed text-slate-700 dark:text-neutral-300">
        <label htmlFor={id} className="cursor-pointer font-medium text-ink dark:text-neutral-100">
          {label}
        </label>{" "}
        <span className="text-muted dark:text-neutral-400">
          {document ? `Version ${document.version}, effective ${document.effectiveDate}.` : ""}
        </span>
        <Link
          href={href}
          target="_blank"
          rel="noreferrer"
          className="ml-1 inline-flex items-center gap-1 font-semibold text-brand-700 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-brand-300"
        >
          Review
          <ArrowSquareOut size={13} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

/**
 * Explicit, unchecked-by-default consent for both legal documents.
 *
 * <p>The versions come from the server's public legal endpoint and are sent
 * back with registration/invitation requests. The backend refuses the request
 * if either checkbox is missing or the accepted version is stale.
 */
export function LegalConsent({
  documents,
  loading,
  error,
  onRetry,
  acceptedTerms,
  acceptedPrivacy,
  onChange,
  errorMessage,
  className,
}: LegalConsentProps) {
  const terms = documentByCode(documents, "TERMS_OF_SERVICE");
  const privacy = documentByCode(documents, "PRIVACY_POLICY");

  return (
    <fieldset className={cn("flex flex-col gap-2.5", className)} aria-describedby="legal-consent-help">
      <legend className="text-sm font-semibold text-ink dark:text-neutral-100">
        Legal agreement
      </legend>
      <p id="legal-consent-help" className="text-xs leading-relaxed text-muted dark:text-neutral-400">
        You must accept both documents to continue. Acceptances are recorded with your user,
        organisation, document versions and timestamp.
      </p>

      {loading ? (
        <div className="flex min-h-[76px] items-center justify-center rounded-xl border border-dashed border-line dark:border-neutral-800">
          <Spinner label="Loading legal documents…" />
        </div>
      ) : null}

      {!loading && error ? (
        <Alert tone="error">
          <div className="flex flex-col gap-2">
            <span>{error}</span>
            <button
              type="button"
              onClick={onRetry}
              className="w-fit rounded-lg border border-red-300 px-2.5 py-1 text-xs font-semibold text-red-800 transition-colors hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:border-red-800 dark:text-red-200 dark:hover:bg-red-900/40"
            >
              Try again
            </button>
          </div>
        </Alert>
      ) : null}

      {!loading && !error && (!terms || !privacy) ? (
        <Alert tone="warning">
          The legal documents are not available right now. Please retry or contact support.
        </Alert>
      ) : null}

      {!loading && !error && terms && privacy ? (
        <div className="flex flex-col gap-2">
          <ConsentRow
            id="legal-terms"
            code="TERMS_OF_SERVICE"
            document={terms}
            checked={acceptedTerms}
            onChange={(checked) => onChange({ terms: checked, privacy: acceptedPrivacy })}
            label="I have read and accept the Terms of Service."
          />
          <ConsentRow
            id="legal-privacy"
            code="PRIVACY_POLICY"
            document={privacy}
            checked={acceptedPrivacy}
            onChange={(checked) => onChange({ terms: acceptedTerms, privacy: checked })}
            label="I have read and accept the Privacy Policy."
          />
        </div>
      ) : null}

      {errorMessage ? <Alert tone="error">{errorMessage}</Alert> : null}
    </fieldset>
  );
}

export function legalVersions(documents: LegalDocument[]): {
  termsVersion?: string;
  privacyVersion?: string;
} {
  return {
    termsVersion: documentByCode(documents, "TERMS_OF_SERVICE")?.version,
    privacyVersion: documentByCode(documents, "PRIVACY_POLICY")?.version,
  };
}
