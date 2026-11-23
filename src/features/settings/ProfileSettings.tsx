"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { updateProfile, uploadAvatar, type Profile } from "@/features/settings/api";
import { ApiError } from "@/lib/api-client";

export function ProfileSettings({
  profile,
  onSaved,
}: {
  profile: Profile;
  onSaved: () => Promise<void>;
}) {
  const [fullName, setFullName] = useState(profile.fullName);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const trimmed = avatarUrl.trim();
      await updateProfile({
        fullName: fullName.trim() || undefined,
        ...(trimmed ? { avatarUrl: trimmed } : { clearAvatar: true }),
      });
      setNotice("Profile saved.");
      await onSaved();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not save your profile.");
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
      const updated = await uploadAvatar(file);
      setAvatarUrl(updated.avatarUrl ?? "");
      setNotice("Photo uploaded.");
      await onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not upload the photo.");
    } finally {
      setUploading(false);
    }
  };

  const initial = (profile.fullName || profile.email).charAt(0).toUpperCase();

  return (
    <div className="flex flex-col gap-4">
      <Card title="Personal profile">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            {avatarUrl.trim() ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl.trim()}
                alt="Profile photo preview"
                className="h-14 w-14 rounded-full object-cover"
              />
            ) : (
              <span
                aria-hidden="true"
                className="flex h-14 w-14 items-center justify-center rounded-full bg-navy-900 text-xl font-bold text-white dark:bg-neutral-800"
              >
                {initial}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink dark:text-neutral-100">
                {profile.email}
              </p>
              <p className="text-xs capitalize text-muted dark:text-neutral-400">
                {profile.role.toLowerCase().replace("_", " ")}
              </p>
            </div>
          </div>
          <Input
            label="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            maxLength={200}
            required
          />
          <Input
            label="Photo URL"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://… or upload below"
          />
          <div>
            <label
              htmlFor="avatar-file"
              className="text-xs font-bold text-ink dark:text-neutral-200"
            >
              Upload a photo
            </label>
            <input
              id="avatar-file"
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={(e) => onFile(e.target.files?.[0])}
              className="mt-1.5 block text-sm text-slate-600 file:mr-3 file:rounded-lg file:border file:border-[#d6dfec] file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-ink hover:file:bg-slate-50 dark:text-neutral-400 dark:file:border-neutral-700 dark:file:bg-neutral-900 dark:file:text-neutral-100"
            />
            <p className="mt-1 text-[11px] text-muted dark:text-neutral-400">
              {uploading ? "Uploading…" : "PNG, JPG, or GIF up to 5MB. Photos are downscaled and compressed losslessly before upload."}
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
      {saving ? <Spinner label="Saving profile…" /> : null}
      <div>
        <Button onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save profile"}
        </Button>
      </div>
    </div>
  );
}
