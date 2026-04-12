"use client";
import { useState, useEffect } from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  BoxIconLine,
  GroupIcon,
} from "../../icons";
import Badge from "../ui/badge/Badge";
import { DollarSignIcon, TrendingUpIcon } from "lucide-react";

interface OrderStats {
  totalOrders: number;
  byStatus: {
    pending: number;
    confirmed: number;
    processing: number;
    shipped: number;
    in_transit: number;
    out_for_delivery: number;
    delivered: number;
    cancelled: number;
    refunded: number;
    on_hold: number;
  };
  byPayment: {
    paid: number;
    pending: number;
    failed: number;
  };
  totalRevenue: number;
}

interface DashboardStats {
  totalCustomers: number;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  pendingOrders: number;
  deliveredOrders: number;
  customersChange: number;
  ordersChange: number;
  revenueChange: number;
  conversionRate: number;
}

export default function EcommerceMetrics() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get auth token
  const getAuthToken = () => {
    const sessionToken = sessionStorage.getItem("token");
    if (sessionToken) return sessionToken;
    
    try {
      const authUserStr = localStorage.getItem("authUser");
      if (authUserStr) {
        const authUser = JSON.parse(authUserStr);
        if (authUser.token) return authUser.token;
      }
    } catch (error) {
      console.error("Error parsing authUser:", error);
    }
    
    return localStorage.getItem("token");
  };

  // Fetch users count
  const fetchUsers = async (token: string) => {
    try {
      const response = await fetch(
        "https://gamersbd-server.onrender.com/api/users",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        return data.data?.length || 0;
      }
      return 0;
    } catch (error) {
      console.error("Error fetching users:", error);
      return 0;
    }
  };

  // Fetch order stats
  const fetchOrderStats = async (token: string): Promise<OrderStats | null> => {
    try {
      const response = await fetch(
        "https://gamersbd-server.onrender.com/api/orders/stats/dashboard",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          return data.stats;
        }
      }
      return null;
    } catch (error) {
      console.error("Error fetching order stats:", error);
      return null;
    }
  };

  // Fetch all orders for previous period calculation
  const fetchAllOrders = async (token: string) => {
    try {
      const response = await fetch(
        "https://gamersbd-server.onrender.com/api/orders?page=1&limit=1000",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          return data.orders || [];
        }
      }
      return [];
    } catch (error) {
      console.error("Error fetching orders:", error);
      return [];
    }
  };

  // Calculate percentage change
  const calculateChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  // Get previous month's data
  const getPreviousPeriodData = (orders: any[]) => {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const currentMonthOrders = orders.filter(
      (order) => new Date(order.createdAt) >= currentMonthStart
    );
    const previousMonthOrders = orders.filter(
      (order) =>
        new Date(order.createdAt) >= previousMonthStart &&
        new Date(order.createdAt) <= previousMonthEnd
    );

    const currentRevenue = currentMonthOrders.reduce(
      (sum, order) => sum + (order.total || 0),
      0
    );
    const previousRevenue = previousMonthOrders.reduce(
      (sum, order) => sum + (order.total || 0),
      0
    );

    return {
      currentOrders: currentMonthOrders.length,
      previousOrders: previousMonthOrders.length,
      currentRevenue,
      previousRevenue,
    };
  };

  const fetchDashboardData = async () => {
    const token = getAuthToken();
    if (!token) {
      setError("No authentication token found");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const [totalCustomers, orderStats, allOrders] = await Promise.all([
        fetchUsers(token),
        fetchOrderStats(token),
        fetchAllOrders(token),
      ]);

      const { currentOrders, previousOrders, currentRevenue, previousRevenue } =
        getPreviousPeriodData(allOrders);

      const ordersChange = calculateChange(currentOrders, previousOrders);
      const revenueChange = calculateChange(currentRevenue, previousRevenue);

      const totalOrders = orderStats?.totalOrders || 0;
      const totalRevenue = orderStats?.totalRevenue || 0;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      setStats({
        totalCustomers: totalCustomers,
        totalOrders: totalOrders,
        totalRevenue: totalRevenue,
        averageOrderValue: averageOrderValue,
        pendingOrders: orderStats?.byStatus?.pending || 0,
        deliveredOrders: orderStats?.byStatus?.delivered || 0,
        customersChange: 0,
        ordersChange: ordersChange,
        revenueChange: revenueChange,
        conversionRate: totalCustomers > 0 ? (totalOrders / totalCustomers) * 100 : 0,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 animate-pulse"
          >
            <div className="w-12 h-12 bg-gray-200 rounded-xl dark:bg-gray-700"></div>
            <div className="mt-5">
              <div className="h-4 bg-gray-200 rounded w-20 dark:bg-gray-700"></div>
              <div className="h-8 bg-gray-200 rounded w-32 mt-2 dark:bg-gray-700"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-900/20">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  const customersChange = stats?.customersChange ?? 0;
  const ordersChange = stats?.ordersChange ?? 0;
  const revenueChange = stats?.revenueChange ?? 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
      {/* Total Customers */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>

        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Total Customers
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {stats?.totalCustomers?.toLocaleString() || 0}
            </h4>
          </div>
          {customersChange !== 0 && (
            <Badge color={customersChange > 0 ? "success" : "error"}>
              {customersChange > 0 ? <ArrowUpIcon /> : <ArrowDownIcon />}
              {Math.abs(customersChange).toFixed(1)}%
            </Badge>
          )}
        </div>
      </div>

      {/* Total Orders */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <BoxIconLine className="text-gray-800 size-6 dark:text-white/90" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Total Orders
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {stats?.totalOrders?.toLocaleString() || 0}
            </h4>
          </div>
          <Badge color={ordersChange > 0 ? "success" : "error"}>
            {ordersChange > 0 ? <ArrowUpIcon /> : <ArrowDownIcon />}
            {Math.abs(ordersChange).toFixed(1)}%
          </Badge>
        </div>
      </div>

      {/* Total Revenue */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <DollarSignIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Total Revenue
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              ৳{(stats?.totalRevenue || 0).toLocaleString()}
            </h4>
          </div>
          <Badge color={revenueChange > 0 ? "success" : "error"}>
            {revenueChange > 0 ? <ArrowUpIcon /> : <ArrowDownIcon />}
            {Math.abs(revenueChange).toFixed(1)}%
          </Badge>
        </div>
      </div>

      {/* Average Order Value */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <TrendingUpIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Avg. Order Value
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              ৳{(stats?.averageOrderValue || 0).toLocaleString()}
            </h4>
          </div>
        </div>
      </div>
    </div>
  );
}