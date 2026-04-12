"use client";
import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";

interface OrderItem {
  product: {
    _id: string;
    name: string;
    price: number;
    images?: string[];
  };
  quantity: number;
  platform: string;
  priceAtTime: number;
}

interface Order {
  _id: string;
  orderNumber: string;
  user: {
    name: string;
    email: string;
    phone: string;
  };
  items: OrderItem[];
  total: number;
  status: string;
  payment: {
    method: string;
    status: string;
  };
  createdAt: string;
}

export default function RecentOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
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

  // Fetch recent orders
  const fetchRecentOrders = async () => {
    const token = getAuthToken();
    if (!token) {
      setError("No authentication token found");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        "https://gamersbd-server.onrender.com/api/orders?page=1&limit=10&sort=-createdAt",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.status === 401) {
        setError("Session expired. Please login again.");
        setLoading(false);
        return;
      }

      if (!response.ok) throw new Error("Failed to fetch orders");

      const data = await response.json();
      if (data.success) {
        setOrders(data.orders || []);
      } else {
        setError(data.message || "Failed to fetch orders");
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      setError("Failed to load recent orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentOrders();
  }, []);

  const getStatusBadgeColor = (status: string) => {
    const statusMap: Record<string, "success" | "warning" | "error" | "info"> =
      {
        delivered: "success",
        pending: "warning",
        confirmed: "info",
        processing: "info",
        shipped: "info",
        in_transit: "info",
        out_for_delivery: "info",
        cancelled: "error",
        refunded: "error",
        on_hold: "warning",
      };
    return statusMap[status.toLowerCase()] || "info";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
        <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Recent Orders
            </h3>
          </div>
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="h-12 w-12 bg-gray-200 rounded-lg dark:bg-gray-700"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-32 dark:bg-gray-700"></div>
                <div className="h-3 bg-gray-200 rounded w-24 mt-2 dark:bg-gray-700"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-20 dark:bg-gray-700"></div>
              <div className="h-6 bg-gray-200 rounded w-16 dark:bg-gray-700"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
        <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Recent Orders
            </h3>
          </div>
        </div>
        <div className="text-center py-8">
          <p className="text-red-500 text-sm">{error}</p>
          <button
            onClick={fetchRecentOrders}
            className="mt-3 px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Recent Orders
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Last {orders.length} orders
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchRecentOrders}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
          >
            <svg
              className="stroke-current fill-white dark:fill-gray-800"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2.29004 5.90393H17.7067"
                stroke=""
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M17.7075 14.0961H2.29085"
                stroke=""
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12.0826 3.33331C13.5024 3.33331 14.6534 4.48431 14.6534 5.90414C14.6534 7.32398 13.5024 8.47498 12.0826 8.47498C10.6627 8.47498 9.51172 7.32398 9.51172 5.90415C9.51172 4.48432 10.6627 3.33331 12.0826 3.33331Z"
                fill=""
                stroke=""
                strokeWidth="1.5"
              />
              <path
                d="M7.91745 11.525C6.49762 11.525 5.34662 12.676 5.34662 14.0959C5.34661 15.5157 6.49762 16.6667 7.91745 16.6667C9.33728 16.6667 10.4883 15.5157 10.4883 14.0959C10.4883 12.676 9.33728 11.525 7.91745 11.525Z"
                fill=""
                stroke=""
                strokeWidth="1.5"
              />
            </svg>
            Refresh
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200">
            See all
          </button>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto">
        <Table>
          {/* Table Header */}
          <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
            <TableRow>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Image #
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Order #
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Customer
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Items
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Total
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Status
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Date
              </TableCell>
            </TableRow>
          </TableHeader>

          {/* Table Body */}
          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {orders.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={"6"}
                  className="py-8 text-center text-gray-500"
                >
                  No orders found
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow
                  key={order._id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <TableCell className="py-3">
                    <div>
                      <img src="{order.image}"></img>
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <div>
                      <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                        {order.orderNumber}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <div>
                      <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                        {order.user?.name}
                      </p>
                      <span className="text-gray-500 text-theme-xs dark:text-gray-400">
                        {order.user?.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 text-theme-sm dark:text-gray-400">
                        {order.items?.length || 0} item(s)
                      </span>
                      {order.items && order.items.length > 0 && (
                        <div className="flex -space-x-2">
                          {order.items.slice(0, 3).map((item, idx) => (
                            <div
                              key={idx}
                              className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300 border-2 border-white dark:border-gray-800"
                            >
                              {item.quantity}
                            </div>
                          ))}
                          {order.items.length > 3 && (
                            <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs font-medium text-gray-700 dark:text-gray-200 border-2 border-white dark:border-gray-800">
                              +{order.items.length - 3}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <p className="font-semibold text-gray-800 text-theme-sm dark:text-white/90">
                      ৳{order.total.toLocaleString()}
                    </p>
                    <span className="text-gray-500 text-theme-xs dark:text-gray-400 capitalize">
                      {order.payment?.method?.replace(/_/g, " ")}
                    </span>
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge size="sm" color={getStatusBadgeColor(order.status)}>
                      {order.status?.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3">
                    <p className="text-gray-500 text-theme-sm dark:text-gray-400">
                      {formatDate(order.createdAt)}
                    </p>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Summary Footer */}
      {orders.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Total Revenue:{" "}
            <span className="font-semibold text-gray-800 dark:text-white">
              ৳
              {orders
                .reduce((sum, order) => sum + order.total, 0)
                .toLocaleString()}
            </span>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Avg. Order:{" "}
            <span className="font-semibold text-gray-800 dark:text-white">
              ৳
              {(
                orders.reduce((sum, order) => sum + order.total, 0) /
                orders.length
              ).toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
