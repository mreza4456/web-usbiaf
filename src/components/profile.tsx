"use client";
import React, { useState } from "react";
import { User, Mail, Globe, Twitter, MessageCircle, Twitch, Instagram, Youtube, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { updateProfileInfo, updateSocialAccounts } from "@/action/setting";
import { IUser } from "@/interface";

interface ProfileTabProps {
  currentUser: IUser;
  onUserUpdated?: (partial: Partial<IUser>) => void;
}

// Field text biasa (bukan password) — dipakai buat Email, Country, dan semua
// social handle. Di mockup beberapa field ini kepasang style password (ada
// icon mata), padahal isinya bukan password sama sekali — itu kebalik pas
// bikin mockup, jadi di sini semua field profil pakai input teks polos.
function TextField({
  icon: Icon,
  label,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label className="text-xl text-primary text-lilita flex items-center">
        <Icon className="w-4 h-4 mr-2" />
        {label}
      </label>
      <input
        type="text"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-5 py-2.5 bg-muted/50 text-fredoka text-primary rounded-full border-2 border-primary disabled:opacity-60 transition-all"
      />
    </div>
  );
}

export default function ProfileTab({ currentUser, onUserUpdated }: ProfileTabProps): React.ReactElement {
  // full_name di-split jadi First/Last biar sesuai mockup, meskipun di DB
  // cuma ada 1 kolom full_name. Digabung lagi pas save.
  const [lastName, setLastName] = useState(
    currentUser.full_name?.split(" ").slice(1).join(" ") ?? ""
  );
  const [firstNameState, setFirstName] = useState(currentUser.full_name?.split(" ")[0] ?? "");
  const [country, setCountry] = useState((currentUser as any).country ?? "");
  const [social, setSocial] = useState({
    x: (currentUser as any).x ?? "",
    discord: (currentUser as any).discord ?? "",
    twitch: currentUser.twitch ?? "",
    instagram: currentUser.instagram ?? "",
    kick: (currentUser as any).kick ?? "",
    youtube: (currentUser as any).youtube ?? "",
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingSocial, setSavingSocial] = useState(false);
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

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    const full_name = `${firstNameState} ${lastName}`.trim();
    const res = await updateProfileInfo({ full_name, country });
    flash(res.success, res.message ?? (res.success ? "Berhasil" : "Gagal"));
    if (res.success) onUserUpdated?.({ full_name, ...(res.data ?? {}) } as Partial<IUser>);
    setSavingProfile(false);
  };

  const handleSaveSocial = async () => {
    setSavingSocial(true);
    const res = await updateSocialAccounts(social);
    flash(res.success, res.message ?? (res.success ? "Berhasil" : "Gagal"));
    if (res.success) onUserUpdated?.(res.data as Partial<IUser>);
    setSavingSocial(false);
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

      {/* Profile Information */}
      <section className="space-y-4">
        <div className=" ">
          <h2 className="text-2xl text-primary fredoka-bold">Profile Information</h2>
          <p className="text-primary/70 text-fredoka">
            Update or change your profile data, information and your contact.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
          <TextField icon={User} label="First Name" value={firstNameState} onChange={setFirstName} placeholder="Enter First Name" />
          <TextField icon={User} label="Last Name" value={lastName} onChange={setLastName} placeholder="Enter Last Name" />
          <TextField icon={Mail} label="Email" value={currentUser.email ?? ""} onChange={() => {}} placeholder="Enter Email" disabled />
          <TextField icon={Globe} label="Country/Region" value={country} onChange={setCountry} placeholder="e.g. Indonesia" />
        </div>

        <div className="flex justify-end">
          <Button onClick={() => void handleSaveProfile()} disabled={savingProfile} className="bg-primary text-white rounded-full px-8">
            {savingProfile ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </section>

      {/* Account / Social Media */}
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl text-primary text-lilita">Account</h2>
          <p className="text-primary/70 text-fredoka">Update your social media account.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
          <TextField icon={Twitter} label="Twitter / X" value={social.x} onChange={(v) => setSocial((s) => ({ ...s, x: v }))} placeholder="@username" />
          <TextField icon={MessageCircle} label="Discord" value={social.discord} onChange={(v) => setSocial((s) => ({ ...s, discord: v }))} placeholder="username#0000" />
          <TextField icon={Twitch} label="Twitch" value={social.twitch} onChange={(v) => setSocial((s) => ({ ...s, twitch: v }))} placeholder="channel name" />
          <TextField icon={Instagram} label="Instagram" value={social.instagram} onChange={(v) => setSocial((s) => ({ ...s, instagram: v }))} placeholder="@username" />
          <TextField icon={Zap} label="Kick" value={social.kick} onChange={(v) => setSocial((s) => ({ ...s, kick: v }))} placeholder="channel name" />
          <TextField icon={Youtube} label="Youtube" value={social.youtube} onChange={(v) => setSocial((s) => ({ ...s, youtube: v }))} placeholder="@channel" />
        </div>

        <div className="flex justify-end">
          <Button onClick={() => void handleSaveSocial()} disabled={savingSocial} className="bg-primary text-white rounded-full px-8">
            {savingSocial ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </section>
    </div>
  );
}