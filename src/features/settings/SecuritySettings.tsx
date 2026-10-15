"use client";

import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  beginTwoFactorSetup,
  changePassword,
  confirmTwoFactorSetup,
  disableTwoFactor,
  listSessions,
  revokeSession,
  twoFactorStatus,
  type Session,
} from "@/features/settings/api";
import { ApiError } from "@/lib/api-client";

function FieldError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-sm text-red-600 dark:text-red-400">
      {message}
    </p>
  );
}

function FieldNotice({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="status" className="text-sm text-emerald-700 dark:text-emerald-300">
      {message}
    </p>
  );
}

async function copyText(text: string): Promise<void> {
  // Clipboard API requires a secure context; fall back to execCommand so
  // plain-http local development still works.
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  try {
    if (!document.execCommand("copy")) throw new Error("copy failed");
  } finally {
    area.remove();
  }
}

function BackupCodes({ codes }: { codes: string[] }) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const copyAll = async () => {
    setFeedback(null);
    try {
      await copyText(codes.join("\n"));
      setCopied(true);
      setFeedback("Backup codes copied to the clipboard.");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setFeedback("Could not copy — select the codes manually.");
    }
  };

  const download = () => {
    setFeedback(null);
    try {
      const body = [
        "SmartOS two-factor backup codes",
        "Each code works once. Keep this file somewhere safe.",
        "",
        ...codes,
        "",
      ].join("\n");
      const url = URL.createObjectURL(new Blob([body], { type: "text/plain" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = "smartos-backup-codes.txt";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setFeedback("Backup codes downloaded.");
    } catch {
      setFeedback("Could not download — copy the codes instead.");
    }
  };

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900 dark:bg-emerald-950">
      <p className="font-semibold text-emerald-900 dark:text-emerald-100">
        Backup codes — shown once, store them safely
      </p>
      <ul className="mt-2 grid grid-cols-2 gap-1 font-mono text-[13px] text-emerald-900 dark:text-emerald-100">
        {codes.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" variant="ghost" onClick={copyAll}>
          {copied ? "Copied" : "Copy all"}
        </Button>
        <Button size="sm" variant="ghost" onClick={download}>
          Download
        </Button>
      </div>
      {feedback ? (
        <p role="status" className="mt-2 text-[13px] font-medium text-emerald-900 dark:text-emerald-100">
          {feedback}
        </p>
      ) : null}
    </div>
  );
}

function PasswordCard() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const save = async () => {
    setError(null);
    setNotice(null);
    if (newPassword !== confirm) {
      setError("The new passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
      setNotice("Password changed.");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not change the password.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title="Password">
      <div className="grid gap-3 sm:max-w-md">
        <Input
          label="Current password"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />
        <Input
          label="New password"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          hint="At least 8 characters."
          required
        />
        <Input
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
        <FieldError message={error} />
        <FieldNotice message={notice} />
        <div>
          <Button onClick={save} disabled={busy}>
            {busy ? "Changing…" : "Change password"}
          </Button>
        </div>
      </div>
    </Card>
  );
}

function TwoFactorCard({ onChanged }: { onChanged: () => Promise<void> }) {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [secret, setSecret] = useState<string | null>(null);
  const [otpauthUrl, setOtpauthUrl] = useState<string | null>(null);
  const [showManualKey, setShowManualKey] = useState(false);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = async () => {
    try {
      const s = await twoFactorStatus();
      setEnabled(s.enabled);
      setRemaining(s.remainingBackupCodes);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not load 2FA status.");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const begin = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await beginTwoFactorSetup();
      setSecret(res.secret);
      setOtpauthUrl(res.otpauthUrl);
      setShowManualKey(false);
      setBackupCodes(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not start 2FA setup.");
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await confirmTwoFactorSetup(code.trim());
      setBackupCodes(res.backupCodes);
      setSecret(null);
      setOtpauthUrl(null);
      setCode("");
      setNotice("Two-factor authentication is on. Save the backup codes below.");
      await load();
      await onChanged();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Invalid code — try again.");
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    setError(null);
    try {
      await disableTwoFactor(password);
      setPassword("");
      setNotice("Two-factor authentication is off.");
      await load();
      await onChanged();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not disable 2FA.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card
      title="Two-factor authentication"
      action={
        enabled === null ? undefined : (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-bold ${enabled ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-slate-100 text-slate-600 dark:bg-neutral-800 dark:text-neutral-300"}`}
          >
            {enabled ? "On" : "Off"}
          </span>
        )
      }
    >
      <div className="flex max-w-xl flex-col gap-3 text-sm text-slate-600 dark:text-neutral-400">
        <p>
          Use an authenticator app (Google Authenticator, 1Password, …). Codes rotate every 30
          seconds; backup codes work once each if the app is unavailable.
        </p>
        {enabled === false && secret === null ? (
          <div>
            <Button onClick={begin} disabled={busy}>
              {busy ? "Starting…" : "Set up 2FA"}
            </Button>
          </div>
        ) : null}
        {secret ? (
          <div className="flex flex-col gap-2 rounded-xl border border-line bg-slate-50 p-3 dark:border-neutral-700 dark:bg-neutral-800">
            <p className="font-semibold text-ink dark:text-neutral-100">
              1. Scan this code with the authenticator app
            </p>
            {otpauthUrl ? (
              <div className="flex flex-col items-start gap-2">
                <span className="inline-block rounded-xl bg-white p-3" role="img" aria-label="Two-factor setup QR code">
                  <QRCode value={otpauthUrl} size={160} aria-hidden="true" />
                </span>
                <button
                  type="button"
                  onClick={() => setShowManualKey((v) => !v)}
                  aria-expanded={showManualKey}
                  className="text-[13px] font-semibold text-brand-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-brand-300"
                >
                  {showManualKey ? "Hide manual setup key" : "Can't scan? Enter the key manually"}
                </button>
              </div>
            ) : null}
            {showManualKey ? (
              <>
                <p className="break-all font-mono text-[13px] text-ink dark:text-neutral-100">
                  {secret}
                </p>
                {otpauthUrl ? (
                  <p className="break-all font-mono text-[11px] text-muted dark:text-neutral-400">
                    {otpauthUrl}
                  </p>
                ) : null}
              </>
            ) : null}
            <p className="font-semibold text-ink dark:text-neutral-100">2. Enter the 6-digit code</p>
            <div className="flex max-w-xs flex-col gap-2">
              <Input
                label="Verification code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                inputMode="numeric"
                maxLength={8}
                required
              />
              <div>
                <Button onClick={confirm} disabled={busy || code.trim().length === 0}>
                  {busy ? "Verifying…" : "Verify and enable"}
                </Button>
              </div>
            </div>
          </div>
        ) : null}
        {backupCodes ? (
          <BackupCodes codes={backupCodes} />
        ) : null}
        {enabled ? (
          <div className="flex flex-col gap-2">
            <p>{remaining} unused backup codes remain.</p>
            <div className="grid max-w-xs gap-2">
              <Input
                label="Current password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <div>
                <Button variant="danger" onClick={disable} disabled={busy || !password}>
                  {busy ? "Disabling…" : "Disable 2FA"}
                </Button>
              </div>
            </div>
          </div>
        ) : null}
        <FieldError message={error} />
        <FieldNotice message={notice} />
      </div>
    </Card>
  );
}

function SessionsCard() {
  const [sessions, setSessions] = useState<Session[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    try {
      setSessions(await listSessions());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not load sessions.");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const revoke = async (id: string) => {
    setBusyId(id);
    setError(null);
    setNotice(null);
    try {
      await revokeSession(id);
      setNotice("Session ended.");
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not end the session.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Card title="Active sessions">
      {sessions === null ? (
        <Spinner label="Loading sessions…" />
      ) : sessions.length === 0 ? (
        <EmptyState title="No other sessions" description="Only this device is signed in." />
      ) : (
        <ul className="flex flex-col gap-2">
          {sessions.map((s) => (
            <li
              key={s.id}
              className="flex items-center gap-3 rounded-xl border border-line px-3 py-2 text-sm dark:border-neutral-700"
            >
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink dark:text-neutral-100">
                  Signed in {new Date(s.createdAt).toLocaleString()}
                  {s.current ? " · this device" : ""}
                </p>
                <p className="text-xs text-muted dark:text-neutral-400">
                  Expires {new Date(s.expiresAt).toLocaleString()}
                </p>
              </div>
              {s.current ? (
                <span className="shrink-0 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  Current
                </span>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => revoke(s.id)}
                  disabled={busyId === s.id}
                >
                  {busyId === s.id ? "Ending…" : "End"}
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-2">
        <FieldError message={error} />
        <FieldNotice message={notice} />
      </div>
    </Card>
  );
}

export function SecuritySettings({ onChanged }: { onChanged: () => Promise<void> }) {
  return (
    <div className="flex flex-col gap-4">
      <PasswordCard />
      <TwoFactorCard onChanged={onChanged} />
      <SessionsCard />
    </div>
  );
}
