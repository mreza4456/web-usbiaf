"use client";
import React, { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  INotificationPreferences,
} from "@/action/setting";
import ToggleSwitch from "./toggle-switch";

type PrefKey = "request_updated" | "promotion_discount" | "new_coming" | "newsletter";

const PREF_ITEMS: { key: PrefKey; title: string; description: string }[] = [
  {
    key: "request_updated",
    title: "Request Updated",
    description: "Received request notification (new order, revisions, pending, etc)",
  },
  {
    key: "promotion_discount",
    title: "Promotion and Discount",
    description: "Get notified when a new promo or discount voucher is available",
  },
  {
    key: "new_coming",
    title: "New Coming!",
    description: "Get notified when a new service or category is added",
  },
  {
    key: "newsletter",
    title: "Newsletter",
    description: "Occasional email updates about Nemuneko Studio",
  },
];

export default function NotificationTab(): React.ReactElement {
  const [prefs, setPrefs] = useState<INotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingKey, setPendingKey] = useState<PrefKey | null>(null);
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

  useEffect(() => {
    const load = async () => {
      const res = await getNotificationPreferences();
      if (res.success && res.data) setPrefs(res.data);
      else flash(false, res.message ?? "Gagal memuat preferensi notifikasi");
      setLoading(false);
    };
    void load();
  }, []);

  const handleToggle = async (key: PrefKey, next: boolean) => {
    if (!prefs) return;

    const prevPrefs = prefs;
    // Optimistic update biar toggle-nya terasa instan.
    setPrefs({ ...prefs, [key]: next });
    setPendingKey(key);

    const res = await updateNotificationPreferences({ [key]: next });

    if (!res.success) {
      setPrefs(prevPrefs); // rollback
      flash(false, res.message ?? "Gagal menyimpan preferensi");
    }
    setPendingKey(null);
  };

  if (loading || !prefs) {
    return <p className="text-primary/60 text-fredoka">Loading preferences...</p>;
  }

  return (
    <div className="space-y-6">
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

      <div>
        <h2 className="text-2xl text-primary text-lilita">Notification Preferences</h2>
        <p className="text-primary/70 text-fredoka">Set what notification you want to received or updated</p>
      </div>

      <div className="space-y-5">
        {PREF_ITEMS.map(({ key, title, description }) => (
          <div
            key={key}
            className="flex items-center justify-between shadow-setting bg-white rounded-3xl border-2 border-primary px-6 py-6"
          >
            <div className="pr-6">
              <p className="text-2xl text-primary text-lilita">{title}</p>
              <p className="text-primary/60 text-fredoka">{description}</p>
            </div>
            <ToggleSwitch
              checked={prefs[key]}
              disabled={pendingKey === key}
              onChange={(next) => void handleToggle(key, next)}
              label={title}
            />
          </div>
        ))}
      </div>
    </div>
  );
}