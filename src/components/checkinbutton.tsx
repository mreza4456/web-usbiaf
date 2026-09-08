"use client";
import React, { useEffect, useState, useTransition } from "react";
import { checkinMission, getCheckinCalendar, getDailyCheckinMission } from "@/action/mission";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

type DayInfo = {
  date: string;
  label: number;
  checked: boolean;
  isToday: boolean;
};

const DAY_NAMES = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

function formatCountdown(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export default function CheckinButton(): React.ReactElement | null {
  const [missionId, setMissionId] = useState<string | null>(null);
  const [missionTitle, setMissionTitle] = useState("");
  const [data, setData] = useState<{
    progress: number;
    target: number;
    canCheckin: boolean;
    nextResetAt: string;
    days: DayInfo[];
  } | null>(null);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const [countdown, setCountdown] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const loadCalendar = async (id: string) => {
    const res = await getCheckinCalendar(id);
    if (res.success && res.data) {
      setData(res.data);
    } else {
      console.error("getCheckinCalendar failed:", res.message);
      setLoadError(res.message || "Gagal memuat kalender check-in");
    }
  };

  useEffect(() => {
    (async () => {
      const res = await getDailyCheckinMission();
      if (res.success && res.data) {
        setMissionId(res.data.missionId);
        setMissionTitle(res.data.title);
        await loadCalendar(res.data.missionId);
      } else {
        console.error("getDailyCheckinMission failed:", res.message);
        setLoadError(res.message || "Mission check-in tidak ditemukan");
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!data || data.canCheckin) return;
    const tick = () => {
      const diff = new Date(data.nextResetAt).getTime() - Date.now();
      setCountdown(formatCountdown(diff));
      if (diff <= 0 && missionId) void loadCalendar(missionId);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [data, missionId]);

  const handleCheckin = () => {
    if (!missionId) return;
    setMessage("");
    startTransition(async () => {
      const res = await checkinMission(missionId);
      setMessage(res.message || (res.success ? "Check-in berhasil!" : "Gagal check-in"));
      await loadCalendar(missionId);
    });
  };

  if (loading) {
    return (
      <div className="rounded-3xl border-2 border-primary/30 p-6 mt-6 text-sm text-gray-400">
        Memuat check-in...
      </div>
    );
  }

  if (!missionId || !data) {
    if (process.env.NODE_ENV !== "production") {
      return (
        <div className="rounded-3xl border-2 border-red-400 p-6 mt-6 text-sm text-red-500">
          Check-in tidak muncul: {loadError || "tidak diketahui"}
          <br />
          Cek console browser/server untuk detail, dan pastikan ada mission dengan
          mission_type = &apos;LOGIN_COUNT&apos; dan is_active = true.
        </div>
      );
    }
    return null;
  }

  return (
    <div className="rounded-3xl border-2 border-primary p-6 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-primary">{missionTitle || "Daily Check-in"}</h3>
        <span className="text-sm text-gray-500">
          {data.progress}/{data.target} hari
        </span>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-4">
        {data.days.map((day) => {
          const d = new Date(day.date + "T00:00:00Z");
          const dayName = DAY_NAMES[d.getUTCDay()];
          const highlight = day.isToday && !day.checked;

          return (
            <div
              key={day.date}
              className={[
                "flex flex-col items-center justify-center rounded-2xl py-3 transition-all duration-300",
                day.checked
                  ? "bg-primary text-white"
                  : highlight
                    ? "bg-primary/10 border-2 border-primary scale-110 shadow-lg animate-pulse"
                    : "bg-gray-100 text-gray-400",
              ].join(" ")}
            >
              <span className="text-xs">{dayName}</span>
              <span className="text-lg font-bold">{day.label}</span>
              {day.checked && <Check className="w-4 h-4 mt-1" />}
            </div>
          );
        })}
      </div>

      <Button onClick={handleCheckin} disabled={!data.canCheckin || isPending} className="w-full">
        {isPending
          ? "Memproses..."
          : data.canCheckin
            ? "Check-in Now"
            : `Already Checked-in`}
      </Button>

      {message && <p className="text-sm text-center mt-2 text-gray-500">{message}</p>}
    </div>
  );
}