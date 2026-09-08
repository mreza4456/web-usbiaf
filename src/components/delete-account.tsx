"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { UserX, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { deleteAccount } from "@/action/user";
import { supabase } from "@/config/supabase";

const CONFIRM_PHRASE = "ACCOUNT DELETED";

interface DangerTabProps {
  userId: string;
}

export default function DangerTab({ userId }: DangerTabProps): React.ReactElement {
  const router = useRouter();
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const isConfirmed = confirmText.trim().toUpperCase() === CONFIRM_PHRASE;

  const handleDelete = async () => {
    if (!isConfirmed || deleting) return;
    setDeleting(true);
    setError("");

    const res = await deleteAccount(userId);
    if (!res.success) {
      setError(res.message);
      setDeleting(false);
      return;
    }

    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <div className="rounded-3xl border-2 border-primary shadow-setting bg-white overflow-hidden">
      <div className="grid sm:grid-cols-5 gap-6 items-center p-8">
        <div className="space-y-5 col-span-3">
          <div>
            <h2 className="text-3xl text-primary text-lilita">Account Deleted</h2>
            <p className="text-primary ">
              This action is permanent and can't be undone.
            </p>
          </div>

          {error && (
            <Alert className="bg-red-500/10 border-red-500/50 text-red-500">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="rounded-2xl border-2 border-red-400 bg-red-50 shadow-deleted p-5 space-y-3">
            <div className="flex items-center gap-2 text-red-500 fredoka-bold text-lg">
              <UserX className="w-5 h-5" />
              ACCOUNT DELETED
            </div>
            <p className="text-red-500/90 text-fredoka text-sm">
              All data history, messages history, account preferences, orders and everything
              else will be <strong>permanently deleted</strong> and can't be undone.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 relative">
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={`Type "${CONFIRM_PHRASE}" to confirm`}
                className="flex-1 px-5 py-2.5 bg-white text-fredoka text-red-500 rounded-full border-2 border-red-400"
              />
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={!isConfirmed || deleting}
                className="px-6 py-2.5 absolute right-0 top-0.5 rounded-r-full bg-red-500 text-white text-fredoka font-semibold cursor-pointer transition-opacity"
              >
                {deleting ? "Deleting..." : "DELETED!"}
              </button>
            </div>
            <p className="text-red-400 text-fredoka text-xs">
              Type <strong>&quot;{CONFIRM_PHRASE}&quot;</strong> to confirm your action.
            </p>
          </div>
        </div>

        <Image
          src="/images/nemuneko-shocked.webp"
          alt=""
          width={220}
          height={220}
          className="hidden sm:block justify-self-center col-span-2"
        />
      </div>
    </div>
  );
}