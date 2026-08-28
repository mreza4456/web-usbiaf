"use client";
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  User,
  Mail,
  Shield,
  Save,
  X,
  Camera,
  Lock,
  Bell,
  AlertTriangle,
  Trash2,
  Eye,
  EyeOff,
  KeyRound,
  CheckCircle2
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';
import { getUsersById, updateUsers } from '@/action/user';
// Sesuaikan/tambahkan action ini di file action/user.ts kamu:
// - updatePassword(userId, { currentPassword, newPassword })
// - deleteAccount(userId)
import { updatePassword, deleteAccount } from '@/action/user';
import { IUser } from '@/interface';
import { ProfilePageSkeleton } from '@/components/skeleton-card';
import { CardDashedThird } from '@/components/card-dashed';

type TabKey = 'profile' | 'security' | 'notifications' | 'danger';

export default function AccountSettingsPage() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  const [userData, setUserData] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');

  const [profileForm, setProfileForm] = useState({
    full_name: '',
    email: '',
    avatar_url: ''
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    next: false,
    confirm: false
  });
  const [passwordError, setPasswordError] = useState('');

  const [notifPrefs, setNotifPrefs] = useState({
    orderUpdates: true,
    promotions: false,
    newsletter: true
  });

  const [confirmDeleteText, setConfirmDeleteText] = useState('');

  useEffect(() => {
    if (user?.id) {
      loadUserData();
    }
  }, [user?.id]);

  const loadUserData = async () => {
    if (!user?.id) return;
    try {
      const result = await getUsersById(user.id);
      if (result.success && result.data) {
        setUserData(result.data);
        setProfileForm({
          full_name: result.data.full_name || '',
          email: result.data.email || '',
          avatar_url: result.data.avatar_url || ''
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const flashSaved = (message: string) => {
    setSavedMessage(message);
    setTimeout(() => setSavedMessage(''), 3000);
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    setIsSaving(true);
    try {
      const result = await updateUsers(user.id, profileForm);
      if (result.success) {
        setUserData(result.data);
        flashSaved('Profil berhasil diperbarui');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setPasswordError('Semua field wajib diisi');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setPasswordError('Password baru minimal 8 karakter');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Konfirmasi password tidak cocok');
      return;
    }
    if (!user?.id) return;

    setIsSaving(true);
    try {
      const result = await updatePassword(user.id, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      if (result.success) {
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        flashSaved('Password berhasil diubah');
      } else {
        setPasswordError(result.message || 'Gagal mengubah password');
      }
    } catch (error) {
      console.error('Error updating password:', error);
      setPasswordError('Terjadi kesalahan, coba lagi');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotifications = () => {
    // Ganti dengan pemanggilan action penyimpanan preferensi notifikasi jika sudah tersedia
    flashSaved('Preferensi notifikasi disimpan');
  };

  const handleDeleteAccount = async () => {
    if (!user?.id || confirmDeleteText !== 'HAPUS AKUN') return;
    setIsSaving(true);
    try {
      const result = await deleteAccount(user.id);
      if (result.success) {
        router.push('/');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (): string => {
    const name = userData?.full_name || user?.email?.split('@')[0] || 'User';
    return name
      .split(' ')
      .map((n: string) => n.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="min-h-screen max-w-7xl mx-auto">
        <ProfilePageSkeleton />
      </div>
    );
  }

  const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: 'profile', label: 'Profil', icon: User },
    { key: 'security', label: 'Keamanan', icon: Lock },
    { key: 'notifications', label: 'Notifikasi', icon: Bell },
    { key: 'danger', label: 'Zona Bahaya', icon: AlertTriangle }
  ];

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl">

        {/* Header, konsisten dengan ProfilePage */}
        <div className="rounded-lg mb-6">
          <div className="h-45 rounded-4xl bg-primary"></div>

          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-end -mt-15 sm:-mt-13 lg:ml-5">
              <div className="relative group">
                <div className="w-40 h-40 rounded-full border-4 border-white shadow-xl">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-4xl font-bold text-gray-700">
                    {userData?.avatar_url ? (
                      <img src={userData.avatar_url} alt="avatar" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      getInitials()
                    )}
                  </div>
                </div>
                <button className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors">
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 sm:ml-6 mt-4 sm:-mt-20 text-center sm:text-left">
                <p className="text-3xl font-bold text-primary">Account Settings</p>
                <p className="text-lg font-bold text-primary">{userData?.email}</p>
                <div className="flex items-center justify-center sm:justify-start gap-2 mt-2 flex-wrap">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    {userData?.role || 'user'}
                  </Badge>
                  {savedMessage && (
                    <Badge variant="outline" className="flex items-center gap-1 text-green-600 border-green-600">
                      <CheckCircle2 className="w-3 h-3" />
                      {savedMessage}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 sm:px-6">
          {/* Tab switcher, styling konsisten dengan tombol Edit Profile di ProfilePage */}
          <div className="flex gap-2 flex-wrap mb-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <Button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  variant={isActive ? 'default' : 'outline'}
                  className={
                    isActive
                      ? 'rounded-full bg-primary text-primary-foreground'
                      : 'rounded-full bg-muted text-primary border-2 border-primary'
                  }
                  size="sm"
                >
                  <Icon className="w-4 h-4 mr-2" />
                  <p className="text-lilita">{tab.label}</p>
                </Button>
              );
            })}
          </div>

          <CardDashedThird>
            <div className="p-6 sm:p-8">

              {/* PROFIL */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-primary">Informasi Profil</h2>
                    <p className="text-sm text-muted-foreground">Perbarui data profil dan informasi kontak kamu.</p>
                  </div>
                  <Separator />

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="full_name" className="flex items-center gap-2 text-primary">
                        <User className="w-4 h-4" /> Nama Lengkap
                      </Label>
                      <Input
                        id="full_name"
                        value={profileForm.full_name}
                        onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                        placeholder="Nama lengkap"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="flex items-center gap-2 text-primary">
                        <Mail className="w-4 h-4" /> Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                        placeholder="email@domain.com"
                      />
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="avatar_url" className="flex items-center gap-2 text-primary">
                        <Camera className="w-4 h-4" /> URL Avatar
                      </Label>
                      <Input
                        id="avatar_url"
                        value={profileForm.avatar_url}
                        onChange={(e) => setProfileForm({ ...profileForm, avatar_url: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      onClick={() =>
                        setProfileForm({
                          full_name: userData?.full_name || '',
                          email: userData?.email || '',
                          avatar_url: userData?.avatar_url || ''
                        })
                      }
                      variant="outline"
                      className="rounded-full border-2 border-primary text-primary"
                      size="sm"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Reset
                    </Button>
                    <Button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="rounded-full bg-primary"
                      size="sm"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </Button>
                  </div>
                </div>
              )}

              {/* KEAMANAN */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-primary">Keamanan</h2>
                    <p className="text-sm text-muted-foreground">Perbarui password akun kamu secara berkala.</p>
                  </div>
                  <Separator />

                  <div className="grid sm:grid-cols-2 gap-4 max-w-2xl">
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="currentPassword" className="flex items-center gap-2 text-primary">
                        <KeyRound className="w-4 h-4" /> Password Saat Ini
                      </Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showPassword.current ? 'text' : 'password'}
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword({ ...showPassword, current: !showPassword.current })}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        >
                          {showPassword.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword" className="flex items-center gap-2 text-primary">
                        <Lock className="w-4 h-4" /> Password Baru
                      </Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showPassword.next ? 'text' : 'password'}
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                          placeholder="Minimal 8 karakter"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword({ ...showPassword, next: !showPassword.next })}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        >
                          {showPassword.next ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="flex items-center gap-2 text-primary">
                        <Lock className="w-4 h-4" /> Konfirmasi Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showPassword.confirm ? 'text' : 'password'}
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                          placeholder="Ulangi password baru"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        >
                          {showPassword.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {passwordError && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" /> {passwordError}
                    </p>
                  )}

                  <div className="flex justify-end">
                    <Button
                      onClick={handleChangePassword}
                      disabled={isSaving}
                      className="rounded-full bg-primary"
                      size="sm"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {isSaving ? 'Menyimpan...' : 'Ubah Password'}
                    </Button>
                  </div>
                </div>
              )}

              {/* NOTIFIKASI */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-primary">Preferensi Notifikasi</h2>
                    <p className="text-sm text-muted-foreground">Atur notifikasi apa saja yang ingin kamu terima.</p>
                  </div>
                  <Separator />

                  <div className="space-y-4 max-w-2xl">
                    <div className="flex items-center justify-between p-4 rounded-2xl border-2 border-primary">
                      <div>
                        <p className="font-semibold text-primary">Update Pesanan</p>
                        <p className="text-sm text-muted-foreground">Notifikasi status pesanan (pending, diproses, selesai).</p>
                      </div>
                      <Switch
                        checked={notifPrefs.orderUpdates}
                        onCheckedChange={(v) => setNotifPrefs({ ...notifPrefs, orderUpdates: v })}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-2xl border-2 border-primary">
                      <div>
                        <p className="font-semibold text-primary">Promosi & Penawaran</p>
                        <p className="text-sm text-muted-foreground">Info diskon dan promo terbaru.</p>
                      </div>
                      <Switch
                        checked={notifPrefs.promotions}
                        onCheckedChange={(v) => setNotifPrefs({ ...notifPrefs, promotions: v })}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-2xl border-2 border-primary">
                      <div>
                        <p className="font-semibold text-primary">Newsletter</p>
                        <p className="text-sm text-muted-foreground">Ringkasan berita dan update bulanan.</p>
                      </div>
                      <Switch
                        checked={notifPrefs.newsletter}
                        onCheckedChange={(v) => setNotifPrefs({ ...notifPrefs, newsletter: v })}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleSaveNotifications} className="rounded-full bg-primary" size="sm">
                      <Save className="w-4 h-4 mr-2" />
                      Simpan Preferensi
                    </Button>
                  </div>
                </div>
              )}

              {/* ZONA BAHAYA */}
              {activeTab === 'danger' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-red-600">Zona Bahaya</h2>
                    <p className="text-sm text-muted-foreground">Tindakan berikut bersifat permanen dan tidak dapat dibatalkan.</p>
                  </div>
                  <Separator />

                  <div className="p-4 rounded-2xl border-2 border-red-500 bg-red-50 space-y-3 max-w-2xl">
                    <div className="flex items-center gap-2 text-red-600 font-semibold">
                      <Trash2 className="w-4 h-4" />
                      Hapus Akun
                    </div>
                    <p className="text-sm text-red-700">
                      Semua data akun, riwayat pesanan, dan preferensi kamu akan dihapus secara permanen.
                      Ketik <span className="font-bold">HAPUS AKUN</span> untuk konfirmasi.
                    </p>
                    <Input
                      value={confirmDeleteText}
                      onChange={(e) => setConfirmDeleteText(e.target.value)}
                      placeholder="HAPUS AKUN"
                      className="max-w-xs bg-white"
                    />
                    <Button
                      onClick={handleDeleteAccount}
                      disabled={confirmDeleteText !== 'HAPUS AKUN' || isSaving}
                      variant="destructive"
                      className="rounded-full"
                      size="sm"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {isSaving ? 'Menghapus...' : 'Hapus Akun Saya'}
                    </Button>
                  </div>
                </div>
              )}

            </div>
          </CardDashedThird>
        </div>

      </div>
    </div>
  );
}