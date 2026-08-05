'use client';

import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getAllOrdersWithItems } from '@/action/order';
import { getAllProducts } from '@/action/product';
import { getAllCategories } from '@/action/categories';
import { getAllUsers } from '@/action/user';

import { IOrderWithItems, IProduct, ICategory, IImageCategories, IUser } from '@/interface';
import { Spinner } from '@/components/ui/spinner';
import { SiteHeader } from '@/components/site-header';

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30days');
  const [orders, setOrders] = useState<IOrderWithItems[]>([]);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [categories, setCategories] = useState<(ICategory & { images: IImageCategories[] })[]>([]);
  const [users, setUsers] = useState<IUser[]>([]);
  
  // Calculated stats
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalUsers: 0,
    pendingOrders: 0,
    processingOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
  });

  // Charts data
  const [revenueData, setRevenueData] = useState<{ date: string; revenue: number; orders: number }[]>([]);
  const [ordersByStatus, setOrdersByStatus] = useState<{ name: string; value: number; color: string }[]>([]);
  const [topCategories, setTopCategories] = useState<any[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<{ month: string; revenue: number }[]>([]);
  const [userGrowth, setUserGrowth] = useState<{ month: string; users: number }[]>([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [ordersRes, productsRes, categoriesRes, usersRes] = await Promise.all([
        getAllOrdersWithItems(),
        getAllProducts(),
        getAllCategories(),
        getAllUsers(),
      ]);

      if (ordersRes.success) setOrders(ordersRes.data);
      if (productsRes.success) setProducts(productsRes.data);
      if (categoriesRes.success) setCategories(categoriesRes.data);
      if (usersRes.success) setUsers(usersRes.data);

      // Calculate stats
      if (ordersRes.success) {
        const ordersData = ordersRes.data;
        
        const totalRevenue = ordersData
          .filter(order => order.status === 'completed')
          .reduce((sum, order) => sum + (order.total || 0), 0);

        const pending = ordersData.filter(o => o.status === 'pending').length;
        const processing = ordersData.filter(o => o.status === 'processing').length;
        const completed = ordersData.filter(o => o.status === 'completed').length;
        const cancelled = ordersData.filter(o => o.status === 'cancelled').length;

        setStats({
          totalRevenue,
          totalOrders: ordersData.length,
          totalProducts: productsRes.success ? productsRes.data.length : 0,
          totalUsers: usersRes.success ? usersRes.data.length : 0,
          pendingOrders: pending,
          processingOrders: processing,
          completedOrders: completed,
          cancelledOrders: cancelled,
        });

        // Prepare orders by status for pie chart
        setOrdersByStatus([
          { name: 'Pending', value: pending, color: '#fbbf24' },
          { name: 'Processing', value: processing, color: '#3b82f6' },
          { name: 'Completed', value: completed, color: '#10b981' },
          { name: 'Cancelled', value: cancelled, color: '#ef4444' },
        ]);

        // Prepare daily revenue data (last 7 days)
        const dailyData = prepareDailyRevenueData(ordersData);
        setRevenueData(dailyData);

        // Prepare monthly revenue data (last 6 months)
        const monthlyData = prepareMonthlyRevenueData(ordersData);
        setMonthlyRevenue(monthlyData);

        // Prepare top categories data
        if (categoriesRes.success) {
          const categoryStats = prepareCategoryStats(ordersData, categoriesRes.data);
          setTopCategories(categoryStats);
        }
      }

      // Prepare user growth data
      if (usersRes.success) {
        const growthData = prepareUserGrowthData(usersRes.data);
        setUserGrowth(growthData);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const prepareDailyRevenueData = (ordersData: IOrderWithItems[]): { date: string; revenue: number; orders: number }[] => {
    const last7Days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayOrders = ordersData.filter((order: IOrderWithItems) => {
        const orderDate = new Date(order.created_at).toISOString().split('T')[0];
        return orderDate === dateStr && order.status === 'completed';
      });
      
      const revenue = dayOrders.reduce((sum: number, order: IOrderWithItems) => sum + (order.total || 0), 0);
      
      last7Days.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue,
        orders: dayOrders.length,
      });
    }
    
    return last7Days;
  };

  const prepareMonthlyRevenueData = (ordersData: IOrderWithItems[]): { month: string; revenue: number }[] => {
    const monthlyData: { [key: string]: number } = {};
    const months = [];
    const today = new Date();
    
    // Get last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('en-US', { month: 'short' });
      
      months.push({ key: monthKey, label: monthLabel });
      monthlyData[monthKey] = 0;
    }
    
    // Calculate revenue per month
    ordersData
      .filter((order: IOrderWithItems) => order.status === 'completed')
      .forEach((order: IOrderWithItems) => {
        const orderDate = new Date(order.created_at);
        const monthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
        
        if (monthlyData.hasOwnProperty(monthKey)) {
          monthlyData[monthKey] += order.total || 0;
        }
      });
    
    return months.map(({ key, label }) => ({
      month: label,
      revenue: monthlyData[key],
    }));
  };

  const prepareCategoryStats = (ordersData: IOrderWithItems[], categoriesData: any[]): any[] => {
    const categoryStats: { [key: string]: any } = {};
    
    // Initialize categories
    categoriesData.forEach((cat: any) => {
      categoryStats[cat.id] = {
        name: cat.name,
        sales: 0,
        revenue: 0,
      };
    });
    
    // Count sales and revenue from completed orders
    ordersData
      .filter((order: IOrderWithItems) => order.status === 'completed' && order.order_items)
      .forEach((order: IOrderWithItems) => {
        order.order_items.forEach((item: any) => {
          if (categoryStats[item.categories_id]) {
            categoryStats[item.categories_id].sales += item.quantity || 1;
            categoryStats[item.categories_id].revenue += item.total || 0;
          }
        });
      });
    
    // Convert to array and sort by revenue
    return Object.values(categoryStats)
      .filter((cat: any) => cat.sales > 0)
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, 5);
  };

  const prepareUserGrowthData = (usersData: IUser[]): { month: string; users: number }[] => {
    const monthlyUsers: { [key: string]: number } = {};
    const months = [];
    const today = new Date();
    
    // Get last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('en-US', { month: 'short' });
      
      months.push({ key: monthKey, label: monthLabel });
      monthlyUsers[monthKey] = 0;
    }
    
    // Count users created up to each month
    months.forEach(({ key }, index) => {
      const endOfMonth = new Date(key + '-01');
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);
      
      const count = usersData.filter((user: IUser) => {
        const userDate = new Date(user.created_at);
        return userDate < endOfMonth;
      }).length;
      
      monthlyUsers[key] = count;
    });
    
    return months.map(({ key, label }) => ({
      month: label,
      users: monthlyUsers[key],
    }));
  };

  const formatCurrency = (amount: number | string): string => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numAmount);
  };

  const getStatusColor = (status: string): string => {
    const colors = {
      pending: 'bg-amber-100 text-amber-800 border-amber-200',
      processing: 'bg-blue-100 text-blue-800 border-blue-200',
      completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      cancelled: 'bg-rose-100 text-rose-800 border-rose-200',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const recentTransactions = orders.slice(0, 5).map((order: IOrderWithItems) => ({
    id: order.code_order,
    user: order.users?.full_name || order.users?.email || 'N/A',
    total: order.total,
    status: order.status,
    date: new Date(order.created_at).toLocaleDateString('id-ID'),
  }));

  if (loading) {
    return (
      <div className="min-h-screen  flex items-center justify-center">
        <div className="text-center">
         <Spinner className='text-primary w-10 h-10'/>
        
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen ">
          <SiteHeader title="Dashboard" />

      <div className=" mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Revenue */}
          <div className="bg-white rounded-2xl p-6  shadow-xl transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-secondary/50 text-primary rounded-lg p-2">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg text-slate-600 font-medium opacity-90 mb-1">Total Revenue</h3>
            <p className="text-3xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
            <p className="text-sm text-slate-500 opacity-75 mt-2">From completed orders</p>
          </div>

          {/* Total Orders */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-blue-100 rounded-lg p-2">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
            </div>
            <h3 className="text-slate-600 text-lg font-medium mb-1">Total Orders</h3>
            <p className="text-3xl font-bold text-slate-800">{stats.totalOrders}</p>
            <p className="text-sm text-slate-500 mt-2">{stats.completedOrders} completed</p>
          </div>

          {/* Total Products */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-amber-100 rounded-lg p-2">
                <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <span className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full font-medium">Active</span>
            </div>
            <h3 className="text-slate-600 text-lg font-medium mb-1">Total Products</h3>
            <p className="text-3xl font-bold text-slate-800">{stats.totalProducts}</p>
            <p className="text-sm text-slate-500 mt-2">{categories.length} categories</p>
          </div>

          {/* Total Users */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-rose-100 rounded-lg p-2">
                <svg className="w-6 h-6 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
            <h3 className="text-slate-600 text-lg font-medium mb-1">Total Users</h3>
            <p className="text-3xl font-bold text-slate-800">{stats.totalUsers}</p>
            <p className="text-sm text-slate-500 mt-2">Registered members</p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Revenue Trend */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Revenue Trend</h2>
                <p className="text-sm text-slate-600 mt-1">Daily revenue over the last 7 days</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: '12px' }} />
                <YAxis stroke="#64748b" style={{ fontSize: '12px' }} tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                  formatter={(value: any) => formatCurrency(typeof value === 'number' ? value : 0)}
                />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Orders by Status */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800 mb-2">Orders by Status</h2>
            <p className="text-sm text-slate-600 mb-6">Distribution of order statuses</p>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={ordersByStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {ordersByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={(entry as any).color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-3 mt-4">
              {ordersByStatus.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-sm text-slate-700 font-medium">{item.name}</span>
                  <span className="text-sm text-slate-500">({item.value})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Second Row Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Categories */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800 mb-2">Top Selling Categories</h2>
            <p className="text-sm text-slate-600 mb-6">Best performing product categories</p>
            {topCategories.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topCategories} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" stroke="#64748b" style={{ fontSize: '12px' }} />
                  <YAxis type="category" dataKey="name" stroke="#64748b" style={{ fontSize: '12px' }} width={120} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e2e8f0', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                    formatter={(value: any) => formatCurrency(typeof value === 'number' ? value : 0)}
                  />
                  <Bar dataKey="revenue" fill="#6366f1" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-slate-400">
                No category data available
              </div>
            )}
          </div>

          {/* Monthly Revenue */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800 mb-2">Monthly Revenue</h2>
            <p className="text-sm text-slate-600 mb-6">Revenue growth over the last 6 months</p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: '12px' }} />
                <YAxis stroke="#64748b" style={{ fontSize: '12px' }} tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                    formatter={(value: any) => formatCurrency(typeof value === 'number' ? value : 0)}
                />
                <Bar dataKey="revenue" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User Growth Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 mb-8">
          <h2 className="text-xl font-bold text-slate-800 mb-2">User Growth</h2>
          <p className="text-sm text-slate-600 mb-6">Total registered users over time</p>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={userGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: '12px' }} />
              <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Line type="monotone" dataKey="users" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 5 }} activeDot={{ r: 7 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Orders Table */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Recent Orders</h2>
              <p className="text-sm text-slate-600 mt-1">Latest customer orders</p>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Order ID</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Customer</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Total</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.length > 0 ? (
                  recentTransactions.map((order: any, index: number) => (
                    <tr key={index} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-4">
                        <span className="font-mono text-sm font-medium text-indigo-600">{order.id}</span>
                      </td>
                      <td className="py-4 px-4 text-sm text-slate-700">{order.user}</td>
                      <td className="py-4 px-4 text-sm text-slate-600">{order.date}</td>
                      <td className="py-4 px-4 text-sm font-semibold text-slate-800">{formatCurrency(order.total)}</td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No orders available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}