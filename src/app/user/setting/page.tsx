"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/config/supabase";
import { getCurrentUser } from "@/action/user";
import { IUser } from "@/interface";

import ProfileTab from "@/components/profile";
import SecurityTab from "@/components/security";
import NotificationTab from "@/components/notif";
import DangerTab from "@/components/delete-account";

type TabId = "profile" | "security" | "notification" | "danger";

const TABS: { id: TabId; label: string; danger?: boolean }[] = [
  { id: "profile", label: "Profile" },
  { id: "security", label: "Security" },
  { id: "notification", label: "Notification" },
  { id: "danger", label: "Danger!", danger: true },
];

export default function SettingsPage(): React.ReactElement {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const [currentUser, setCurrentUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        router.replace("/auth/login");
        return;
      }
      const res = await getCurrentUser();
      if (res.success && res.data) setCurrentUser(res.data);
      setLoading(false);
    };
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-primary text-fredoka">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-15 ">
      <div className="mx-auto space-y-6 ">
       
         <h1 className="text-4xl sm:text-6xl w-full text-primary leading-5 uppercase mb-10">
                    PROFILE <span className="text-5xl sm:text-7xl bg-title"> SETTING</span>
                </h1>

        {/* Tab bar */}
        <div className="inline-flex flex-wrap w-full sm:w-auto rounded-full border-2 border-primary overflow-hidden">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const base = "px-6 py-3 text-fredoka font-semibold transition-colors flex-1 sm:flex-none";
            const activeClasses = tab.danger
              ? "bg-red-500 text-white "
              : "bg-[#E9D9FB] text-primary border-primary border-r-2";
            const inactiveClasses = tab.danger
              ? "bg-white text-red-500 underline  decoration-red-500"
              : "bg-white text-primary border-primary border-r-2";

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`${base} ${isActive ? activeClasses : inactiveClasses}`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="">
          {activeTab === "profile" && (
            <ProfileTab
              currentUser={currentUser}
              onUserUpdated={(partial) => setCurrentUser((u) => (u ? { ...u, ...partial } : u))}
            />
          )}
          {activeTab === "security" && <SecurityTab userId={currentUser.id} />}
          {activeTab === "notification" && <NotificationTab />}
          {activeTab === "danger" && <DangerTab userId={currentUser.id} />}
        </div>
      </div>
    </div>
  );
}