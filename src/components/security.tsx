"use client";
import React, { useEffect, useState } from "react";
import { Lock, Eye, EyeOff, Chrome, Twitch, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { updatePassword } from "@/action/user";
import { supabase } from "@/config/supabase";
import ToggleSwitch from "./toggle-switch";

// X (Twitter) gak ada icon resmi di lucide-react, jadi pakai svg inline
// yang sama kayak di halaman login.
function XIcon({ className }: { className?: string }): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

type LinkedProvider = "google" | "x" | "twitch";

const PROVIDERS: { id: LinkedProvider; label: string; icon: React.ElementType }[] = [
  { id: "google", label: "Google", icon: Chrome },
  { id: "x", label: "Twitter", icon: XIcon },
  { id: "twitch", label: "Twitch", icon: Twitch },
];

interface SecurityTabProps {
  userId: string;
}

export default function SecurityTab({ userId }: SecurityTabProps): React.ReactElement {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [saving, setSaving] = useState(false);

  const [linkedProviders, setLinkedProviders] = useState<Set<string>>(new Set());
  const [loadingIdentities, setLoadingIdentities] = useState(true);
  const [pendingProvider, setPendingProvider] = useState<LinkedProvider | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const flash = (ok: boolean, message: string) => {
    setError(ok ? "" : message);
    setSuccess(ok ? message : "");
    setTimeout(() => {
      setError("");
      setSuccess("");
    }, 3000);
  };

  // Ambil daftar provider OAuth yang udah nempel ke akun ini.
  useEffect(() => {
    const loadIdentities = async () => {
      setLoadingIdentities(true);
      const { data, error: identError } = await supabase.auth.getUserIdentities();
      if (!identError && data?.identities) {
        setLinkedProviders(new Set(data.identities.map((i) => i.provider)));
      }
      setLoadingIdentities(false);
    };
    void loadIdentities();
  }, []);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      flash(false, "Password saat ini dan password baru wajib diisi.");
      return;
    }
    if (newPassword !== confirmPassword) {
      flash(false, "Konfirmasi password baru tidak cocok.");
      return;
    }

    setSaving(true);
    const res = await updatePassword(userId, { currentPassword, newPassword });
    flash(res.success, res.message);
    if (res.success) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
    setSaving(false);
  };

  // Toggle ON -> link akun OAuth baru (redirect ke provider).
  // Toggle OFF -> unlink identity yang udah ada.
  const handleToggleProvider = async (provider: LinkedProvider, nextChecked: boolean) => {
    setPendingProvider(provider);
    try {
      if (nextChecked) {
        const { error: linkError } = await supabase.auth.linkIdentity({
          provider,
          options: { redirectTo: `${window.location.origin}/auth/callback?from=settings` },
        });
        if (linkError) throw linkError;
        // linkIdentity redirect ke provider, jadi state di-update setelah kembali.
      } else {
        const { data } = await supabase.auth.getUserIdentities();
        const identity = data?.identities?.find((i) => i.provider === provider);
        if (!identity) return;

        // Supabase gak bolehin unlink kalau itu satu-satunya identity yang tersisa.
        if ((data?.identities?.length ?? 0) <= 1) {
          flash(false, "Tidak bisa melepas satu-satunya metode login yang tersisa.");
          return;
        }

        const { error: unlinkError } = await supabase.auth.unlinkIdentity(identity);
        if (unlinkError) throw unlinkError;

        setLinkedProviders((prev) => {
          const next = new Set(prev);
          next.delete(provider);
          return next;
        });
        flash(true, `Akun ${provider} berhasil diputus.`);
      }
    } catch (err: any) {
      flash(false, err.message || `Gagal mengubah koneksi ${provider}.`);
    } finally {
      setPendingProvider(null);
    }
  };

  return (
    <div className="space-y-10">
      {(error || success) && (
        <Alert
          className={
            error
              ? "bg-red-500/10 border-red-500/50 text-red-500"
              : "bg-green-500/10 border-green-500/50 text-green-600"
          }
        >
          {error ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          <AlertDescription>{error || success}</AlertDescription>
        </Alert>
      )}

      {/* Change Password */}
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl text-primary text-lilita">Security</h2>
          <p className="text-primary/70 text-fredoka">Update your password consistently</p>
        </div>

        <div className="space-y-2 max-w-md">
          <label className="text-xl text-primary text-lilita flex items-center">
            <Lock className="w-4 h-4 mr-2" />
            Current Password
          </label>
          <div className="relative">
            <input
              type={showCurrent ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter Password"
              className="w-full px-5 py-2.5 bg-muted/50 text-fredoka text-primary rounded-full border-2 border-primary pr-12"
            />
            <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-4 top-1/2 -translate-y-1/2 text-primary">
              {showCurrent ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
          <div className="space-y-2">
            <label className="text-xl text-primary text-lilita">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter New Password"
              className="w-full px-5 py-2.5 bg-muted/50 text-fredoka text-primary rounded-full border-2 border-primary"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xl text-primary text-lilita">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm New Password"
              className="w-full px-5 py-2.5 bg-muted/50 text-fredoka text-primary rounded-full border-2 border-primary"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => void handleChangePassword()} disabled={saving} className="bg-primary text-white rounded-full px-8">
            {saving ? "Saving..." : "Update Password"}
          </Button>
        </div>
      </section>

      {/* Account Linked (OAuth) */}
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl text-primary text-lilita">Account Linked</h2>
          <p className="text-primary/70 text-fredoka">Link your account to get easily login.</p>
        </div>

        <div className="space-y-4">
          {PROVIDERS.map(({ id, label, icon: Icon }) => {
            const isLinked = linkedProviders.has(id);
            return (
              <div
                key={id}
                className="flex items-center justify-between shadow-setting bg-white rounded-3xl border-2 border-primary px-6 py-5"
              >
                <div className="flex items-center gap-4">
                  <Icon className="w-8 h-8 text-primary" />
                  <div>
                    <p className="text-xl text-primary text-lilita">{label}</p>
                    <p className="text-primary/60 text-fredoka text-sm">
                      {isLinked ? "Connected to your account" : "Not connected yet"}
                    </p>
                  </div>
                </div>
                <ToggleSwitch
                  checked={isLinked}
                  disabled={loadingIdentities || pendingProvider === id}
                  onChange={(next) => void handleToggleProvider(id, next)}
                  label={`Link ${label}`}
                />
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}