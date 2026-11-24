"use client";

import { useState } from "react";
import { OrganizationSwitcher, useUser } from "@clerk/nextjs";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import {
  updateCurrentOrg,
  uploadOrgLogo,
  type CurrentOrganization,
} from "@/features/organization/api";
import { ApiError } from "@/lib/api-client";

export function OrganizationSettings({
  org,
  onSaved,
}: {
  org: CurrentOrganization;
  onSaved: () => Promise<void>;
}) {
  const [name, setName] = useState(org.name);
  const [slug, setSlug] = useState(org.slug);
  const [logoUrl, setLogoUrl] = useState(org.logoUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const { user: clerkUser } = useUser();
  // Only useful when the account actually belongs to several organizations.
  const canSwitchOrganization = (clerkUser?.organizationMemberships?.length ?? 0) > 1;

  const save = async () => {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const trimmedLogo = logoUrl.trim();
      await updateCurrentOrg({
        name: name.trim() || undefined,
        slug: slug.trim() || undefined,
        ...(trimmedLogo ? { logoUrl: trimmedLogo } : { clearLogo: true }),
      });
      setNotice("Organization settings saved.");
      await onSaved();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not save organization settings.");
    } finally {
      setSaving(false);
    }
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setNotice(null);
    setUploading(true);
    try {
      const updated = await uploadOrgLogo(file);
      setLogoUrl(updated.logoUrl ?? "");
      setNotice("Logo uploaded.");
      await onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not upload the logo.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {canSwitchOrganization ? (
        <Card title="Switch organization">
          <p className="mb-3 text-[13px] leading-relaxed text-muted dark:text-neutral-400">
            You belong to more than one organization. Switching changes which organization&apos;s
            data you see.
          </p>
          <OrganizationSwitcher
            hidePersonal
            afterSelectOrganizationUrl="/settings"
            afterCreateOrganizationUrl="/settings"
          />
        </Card>
      ) : null}
      <Card title="Organization details">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Organization name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={255}
            required
          />
          <Input
            label="Slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            hint="Lowercase letters, numbers, and hyphens. Shown in the top bar."
            maxLength={255}
            required
          />
        </div>
        <p className="mt-3 text-[13px] text-slate-600 dark:text-neutral-400">
          Plan: <span className="font-semibold">{org.plan}</span> ·{" "}
          {org.limits.maxUsers} users · {org.limits.maxBooks} books
        </p>
      </Card>

      <Card title="Organization logo">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            {logoUrl.trim() ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl.trim()}
                alt="Organization logo preview"
                className="h-14 w-14 rounded-xl border border-line bg-white object-contain dark:border-neutral-700"
              />
            ) : (
              <span className="flex h-14 w-14 items-center justify-center rounded-xl border border-dashed border-line text-xs text-muted dark:border-neutral-700 dark:text-neutral-400">
                No logo
              </span>
            )}
            <div className="min-w-0 flex-1">
              <Input
                label="Logo URL"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://… or upload below"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="org-logo-file"
              className="text-xs font-bold text-ink dark:text-neutral-200"
            >
              Upload an image
            </label>
            <input
              id="org-logo-file"
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={(e) => onFile(e.target.files?.[0])}
              className="mt-1.5 block text-sm text-slate-600 file:mr-3 file:rounded-lg file:border file:border-[#d6dfec] file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-ink hover:file:bg-slate-50 dark:text-neutral-400 dark:file:border-neutral-700 dark:file:bg-neutral-900 dark:file:text-neutral-100"
            />
            <p className="mt-1 text-[11px] text-muted dark:text-neutral-400">
              {uploading
                ? "Uploading…"
                : "PNG, JPG, SVG, or GIF up to 5MB. Images are downscaled and compressed losslessly before upload. The logo appears in the sidebar and top bar."}
            </p>
          </div>
        </div>
      </Card>

      {error ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p role="status" className="text-sm text-emerald-700 dark:text-emerald-300">
          {notice}
        </p>
      ) : null}
      {saving ? <Spinner label="Saving organization…" /> : null}
      <div>
        <Button onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save organization"}
        </Button>
      </div>
    </div>
  );
}
