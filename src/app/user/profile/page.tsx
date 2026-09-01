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
import { CardDashedThird } from '@/components/card-dashed';
import Image from 'next/image';
import { stat } from 'fs';

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
    const onprogress = orders.filter(o => o.status === 'processing').length;

    return { total, pending, completed, onprogress };
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
    <div className="min-h-screen p-6 md:p-15  ">
      <div className=" mx-auto">

        <div className=" rounded-lg mb-6 ">
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
                {isEditing && (
                  <button className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors">
                    <Camera className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex-1 sm:ml-6 mt-0 arial sm:-mt-20 text-center sm:text-left">
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
                    <p className="text-3xl font-bold text-primary">{displayName}</p>
                    <p className="text-lg font-bold text-primary">{userData?.email}</p>
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
                  <Button onClick={() => setIsEditing(true)} variant="outline" className='bg-muted text-primary border-2 border-primary rounded-full' size="sm">
                   <p className='text-lilita'>Edit Profile</p>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className='px-6 sm:px-6'>
          <CardDashedThird className='  '>
            <div className=' grid grid-cols-2 sm:grid-cols-4  overflow-hidden rounded-[27px]'>
              <Link href="/myorder">
                <div className="p-5 flex gap-10 items-center border-primary border-r-2 border-b-2 sm:border-b-0 ">
                  <div className='text-start text-primary'>
                    <p>Total Order</p>
                    <h1 className='text-3xl'>{stats.total}</h1>
                  </div>
                  <Image alt="" src="/SVG/icontotal.svg" className='hidden lg:block' width={40} height={40} />
                </div>
              </Link>
              <div className="p-5 flex gap-10 sm:bg-muted/50    border-primary sm:border-r-2  border-b-2 sm:border-b-0">
                <div className="flex">
                  <div className='text-start text-primary '>
                    <p>Pending</p>
                    <h1 className='text-3xl'>{stats.pending}</h1>
                  </div>
                </div>
                <Image alt="" src="/SVG/iconsales.svg" className='hidden lg:block' width={40} height={40} />
              </div>
              <div className="p-5 flex gap-10   border-primary border-r-2 ">
                <div className='text-start text-primary'>
                  <p>On Progress</p>
                  <h1 className='text-3xl'>{stats.onprogress}</h1>
                </div>
                <Image alt="" src="/SVG/iconreview.svg" className='hidden lg:block' width={40} height={40} />
              </div>
              <div className="p-5 flex gap-10   border-primary  ">
                <div className='text-start text-primary'>
                  <p>Completed</p>
                  <h1 className='text-3xl'>{stats.completed}</h1>
                </div>
                <Image alt="" src="/SVG/iconmember.svg" className='hidden lg:block' width={40} height={40} />
              </div>
            </div>
          </CardDashedThird>
        </div>

        
      </div>
    </div>
  );
}