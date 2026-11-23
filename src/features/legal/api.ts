import { api } from "@/lib/api-client";
import type { ApiEnvelope, Page, PagedParams, SpringPage } from "@/types/api";
import { toPage } from "@/types/api";

export type LegalDocumentCode = "TERMS_OF_SERVICE" | "PRIVACY_POLICY";

export interface LegalSection {
  id: string;
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
  reviewFlags?: string[];
}

export interface LegalDocumentContent {
  sections: LegalSection[];
  reviewFlags?: string[];
  changelog?: string;
}

export interface LegalDocument {
  id: string;
  code: LegalDocumentCode;
  version: string;
  title: string;
  summary?: string | null;
  effectiveDate: string;
  content: LegalDocumentContent;
}

export type LegalAcceptanceContext = "REGISTRATION" | "INVITE_ACCEPTANCE";

export interface LegalAcceptance {
  id: string;
  userId: string;
  organizationId: string;
  documentCode: LegalDocumentCode;
  documentVersion: string;
  contentHash: string;
  context: LegalAcceptanceContext;
  inviteId?: string | null;
  acceptedAt: string;
}

/** Public endpoint: works before sign-in on registration and invite pages. */
export async function listCurrentLegalDocuments(): Promise<LegalDocument[]> {
  const res = await api.get<ApiEnvelope<LegalDocument[]>>("/legal/documents");
  return res.data;
}

export async function listMyLegalAcceptances(): Promise<LegalAcceptance[]> {
  const res = await api.get<ApiEnvelope<LegalAcceptance[]>>("/legal/acceptances/me");
  return res.data;
}

/** Organisation-wide acceptance evidence, available with audit.read. */
export async function listLegalAcceptances(params: PagedParams): Promise<Page<LegalAcceptance>> {
  const q = new URLSearchParams();
  q.set("page", String(Math.max(0, (params.page ?? 1) - 1)));
  q.set("size", String(params.pageSize ?? 10));
  const res = await api.get<ApiEnvelope<SpringPage<LegalAcceptance>>>(
    `/legal/acceptances?${q.toString()}`,
  );
  return toPage(res.data);
}

export function documentByCode(
  documents: LegalDocument[],
  code: LegalDocumentCode,
): LegalDocument | undefined {
  return documents.find((document) => document.code === code);
}
