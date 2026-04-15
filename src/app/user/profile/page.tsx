"use client";
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  User,
  Mail,
  Calendar,
  Shield,
  Edit2,
  Save,
  X,
  Camera,
  Award,
  ShoppingBag,
  Clock
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';
import { getUsersById, updateUsers } from '@/action/user';
import { getAllOrdersWithItems } from '@/action/order';
import { IUser, IOrder } from '@/interface';
import Link from 'next/link';
import { ProfilePageSkeleton } from '@/components/skeleton-card';

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  const [userData, setUserData] = useState<IUser | null>(null);
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [editForm, setEditForm] = useState({
    full_name: '',
    email: '',
    avatar_url: ''
  });

  useEffect(() => {
    if (user?.id) {
      loadUserData();
      loadUserOrders();
    }
  }, [user?.id]);

  const loadUserData = async () => {
    if (!user?.id) return;

    try {
      const result = await getUsersById(user.id);
      if (result.success && result.data) {
        setUserData(result.data);
        setEditForm({
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

  const loadUserOrders = async () => {
    try {
      const result = await getAllOrdersWithItems();
      if (result.success && result.data) {
        const userOrders = result.data.filter(order => order.user_id === user?.id);
        setOrders(userOrders);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;

    setIsSaving(true);
    try {
      const result = await updateUsers(user.id, editForm);
      if (result.success) {
        setUserData(result.data);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const getDisplayName = () => {
    if (!user) return null;
    if (user.full_name) return user.full_name;
    return user.email?.split("@")[0];
  };

  const getInitials = (): string => {
    const name = getDisplayName() || 'User';

    return name
      .split(' ')
      .map((n: string) => n.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getOrderStats = () => {
    const total = orders.length;
    const pending = orders.filter(o => o.status === 'pending').length;
    const completed = orders.filter(o => o.status === 'completed').length;

    return { total, pending, completed };
  };

  const stats = getOrderStats();
  const displayName = getDisplayName();

  if (loading) {
    return (
      <div className="min-h-screen max-w-7xl mx-auto ">
        <ProfilePageSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen  ">
      <div className="max-w-7xl mx-auto">
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6 ">
          <div className="h-32 bg-secondary"></div>

          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-end -mt-16 sm:-mt-12">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-4xl font-bold text-gray-700">
                    {userData?.avatar_url ? (
                      <img src={userData.avatar_url} alt="avatar" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      getInitials()
                    )}
                  </div>
                </div>
                {isEditing && (
                  <button className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors">
                    <Camera className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex-1 sm:ml-6 mt-4 sm:mt-0 text-center sm:text-left">
                {isEditing ? (
                  <div className="space-y-2">
                    <Input
                      value={editForm.full_name}
                      onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                      placeholder="Full Name"
                      className="max-w-xs"
                    />
                  </div>
                ) : (
                  <>
                    <h1 className="text-3xl font-bold text-gray-900">{displayName}</h1>
                    <div className="flex items-center justify-center sm:justify-start gap-2 mt-2 flex-wrap">
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        {userData?.role || 'user'}
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        {stats.total} Orders
                      </Badge>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-4 sm:mt-0">
                {isEditing ? (
                  <div className="flex gap-2">
                    <Button onClick={handleSave} disabled={isSaving} size="sm">
                      <Save className="w-4 h-4 mr-2" />
                      {isSaving ? 'Saving...' : 'Save'}
                    </Button>
                    <Button onClick={() => setIsEditing(false)} variant="outline" size="sm">
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <Link href="/myorder">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <ShoppingBag className="w-8 h-8 text-blue-500" />
              </div>
            </div>
          </Link>
          <div className="bg-white p-6 rounded-lg shadow-md border-2 border-transparent">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-orange-500">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-2 border-transparent">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-500">{stats.completed}</p>
              </div>
              <Award className="w-8 h-8 text-green-500" />
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Profile Information</h2>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <Label className="text-sm text-gray-600">Email</Label>
                {isEditing ? (
                  <Input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="mt-1"
                  />
                ) : (
                  <p className="text-gray-900">{userData?.email || user?.email}</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <Label className="text-sm text-gray-600">Full Name</Label>
                <p className="text-gray-900">{userData?.full_name || displayName}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <Label className="text-sm text-gray-600">Member Since</Label>
                <p className="text-gray-900">
                  {userData?.created_at ? new Date(userData.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Link to Milestone Page */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg shadow-md p-6 border-2 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Award className="w-6 h-6 text-purple-600" />
                <h2 className="text-xl font-bold text-gray-900">Stamp Journey</h2>
              </div>
              <p className="text-gray-600 mb-4">
                Complete orders to collect stamps and unlock exclusive rewards!
              </p>
              <Badge className="bg-purple-600">
                {stats.completed} Completed Orders
              </Badge>
            </div>
            <Link href="/milestone">
              <Button className="bg-purple-600 hover:bg-purple-700">
                View Milestones
                <Award className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}