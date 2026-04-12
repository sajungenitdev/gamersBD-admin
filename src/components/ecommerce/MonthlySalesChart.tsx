"use client";
import { useState, useEffect } from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { MoreDotIcon } from "../../icons";

interface MonthlyData {
  month: string;
  revenue: number;
  orderCount: number;
}

interface SalesData {
  months: string[];
  revenue: number[];
  orderCounts: number[];
  totalRevenue: number;
  totalOrders: number;
  averageRevenue: number;
}

export default function MonthlySalesChart() {
  const [salesData, setSalesData] = useState<SalesData>({
    months: [],
    revenue: [],
    orderCounts: [],
    totalRevenue: 0,
    totalOrders: 0,
    averageRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [chartType, setChartType] = useState<"revenue" | "orders">("revenue");

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

  // Fetch all orders
  const fetchOrders = async () => {
    const token = getAuthToken();
    if (!token) {
      setError("No authentication token found");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        "https://gamersbd-server.onrender.com/api/orders?page=1&limit=1000",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 401) {
        setError("Session expired. Please login again.");
        setLoading(false);
        return;
      }

      if (!response.ok) throw new Error("Failed to fetch orders");

      const data = await response.json();
      if (data.success) {
        processMonthlyData(data.orders || []);
      } else {
        setError(data.message || "Failed to fetch orders");
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      setError("Failed to load sales data");
    } finally {
      setLoading(false);
    }
  };

  // Process orders into monthly data - FIXED: renamed parameter to 'orderList'
  const processMonthlyData = (orderList: any[]) => {
    const monthlyMap = new Map<string, { revenue: number; orderCount: number }>();
    
    // Initialize last 12 months
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toLocaleString("default", { month: "short", year: "numeric" });
      monthlyMap.set(monthKey, { revenue: 0, orderCount: 0 });
    }

    // Aggregate orders by month - FIXED: using 'orderList' instead of 'orders'
    orderList.forEach((order) => {
      const orderDate = new Date(order.createdAt);
      const monthKey = orderDate.toLocaleString("default", { month: "short", year: "numeric" });
      
      if (monthlyMap.has(monthKey)) {
        const current = monthlyMap.get(monthKey)!;
        monthlyMap.set(monthKey, {
          revenue: current.revenue + (order.total || 0),
          orderCount: current.orderCount + 1,
        });
      }
    });

    // Convert to arrays for chart
    const months: string[] = [];
    const revenue: number[] = [];
    const orderCounts: number[] = [];
    let totalRevenue = 0;
    let totalOrders = 0;

    monthlyMap.forEach((value, key) => {
      months.push(key);
      revenue.push(value.revenue);
      orderCounts.push(value.orderCount);
      totalRevenue += value.revenue;
      totalOrders += value.orderCount;
    });

    setSalesData({
      months,
      revenue,
      orderCounts,
      totalRevenue,
      totalOrders,
      averageRevenue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
    });
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Chart configuration
  const getChartOptions = (): ApexOptions => {
    const isDark = document.documentElement.classList.contains("dark");
    
    return {
      colors: chartType === "revenue" ? ["#465fff"] : ["#10b981"],
      chart: {
        fontFamily: "Outfit, sans-serif",
        type: "bar",
        height: 180,
        toolbar: {
          show: false,
        },
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: "39%",
          borderRadius: 5,
          borderRadiusApplication: "end",
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        show: true,
        width: 4,
        colors: ["transparent"],
      },
      xaxis: {
        categories: salesData.months,
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
        labels: {
          style: {
            colors: isDark ? "#9ca3af" : "#6b7280",
          },
        },
      },
      legend: {
        show: true,
        position: "top",
        horizontalAlign: "left",
        fontFamily: "Outfit",
        labels: {
          colors: isDark ? "#d1d5db" : "#374151",
        },
      },
      yaxis: {
        title: {
          text: chartType === "revenue" ? "Revenue (BDT)" : "Number of Orders",
          style: {
            color: isDark ? "#9ca3af" : "#6b7280",
          },
        },
        labels: {
          formatter: (val: number) => {
            if (chartType === "revenue") {
              return `৳${val.toLocaleString()}`;
            }
            return val.toString();
          },
          style: {
            colors: isDark ? "#9ca3af" : "#6b7280",
          },
        },
      },
      grid: {
        yaxis: {
          lines: {
            show: true,
          },
        },
        borderColor: isDark ? "#374151" : "#e5e7eb",
      },
      fill: {
        opacity: 1,
      },
      tooltip: {
        x: {
          show: false,
        },
        y: {
          formatter: (val: number) => {
            if (chartType === "revenue") {
              return `৳${val.toLocaleString()}`;
            }
            return `${val} orders`;
          },
        },
      },
    };
  };

  const getChartSeries = () => {
    if (chartType === "revenue") {
      return [
        {
          name: "Revenue",
          data: salesData.revenue,
        },
      ];
    } else {
      return [
        {
          name: "Orders",
          data: salesData.orderCounts,
        },
      ];
    }
  };

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  function handleViewChange(type: "revenue" | "orders") {
    setChartType(type);
    closeDropdown();
  }

  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Monthly Sales
          </h3>
        </div>
        <div className="flex items-center justify-center h-[180px]">
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 dark:bg-gray-700"></div>
              <div className="space-y-2">
                <div className="h-32 bg-gray-200 rounded dark:bg-gray-700"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Monthly Sales
          </h3>
        </div>
        <div className="flex flex-col items-center justify-center h-[180px]">
          <p className="text-red-500 text-sm mb-2">{error}</p>
          <button
            onClick={fetchOrders}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Monthly {chartType === "revenue" ? "Revenue" : "Orders"}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {chartType === "revenue" 
              ? `Total Revenue: ৳${salesData.totalRevenue.toLocaleString()}`
              : `Total Orders: ${salesData.totalOrders.toLocaleString()}`}
          </p>
        </div>
        <div className="relative inline-block">
          <button className="dropdown-toggle" onClick={toggleDropdown}>
            <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 size-6" />
          </button>
          <Dropdown
            isOpen={isOpen}
            onClose={closeDropdown}
            className="w-40 p-2"
          >
            <DropdownItem
              onItemClick={() => handleViewChange("revenue")}
              className={`flex w-full font-normal text-left rounded-lg px-3 py-2 ${
                chartType === "revenue"
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
              }`}
            >
              View Revenue
            </DropdownItem>
            <DropdownItem
              onItemClick={() => handleViewChange("orders")}
              className={`flex w-full font-normal text-left rounded-lg px-3 py-2 ${
                chartType === "orders"
                  ? "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
              }`}
            >
              View Orders Count
            </DropdownItem>
            <hr className="my-1 border-gray-200 dark:border-gray-700" />
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              Export Data
            </DropdownItem>
          </Dropdown>
        </div>
      </div>

      {/* Summary Stats */}
      {salesData.months.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mt-4 mb-2">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">Avg Monthly Revenue</p>
            <p className="text-sm font-semibold text-gray-800 dark:text-white">
              ৳{(salesData.totalRevenue / 12).toLocaleString()}
            </p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">Avg Monthly Orders</p>
            <p className="text-sm font-semibold text-gray-800 dark:text-white">
              {(salesData.totalOrders / 12).toLocaleString()}
            </p>
          </div>
        </div>
      )}

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="-ml-5 min-w-[650px] xl:min-w-full pl-2">
          <Chart 
            options={getChartOptions()} 
            series={getChartSeries()} 
            type="bar" 
            height={180} 
          />
        </div>
      </div>

      {/* Legend/Info */}
      <div className="mt-3 pb-4 text-center">
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {chartType === "revenue" 
            ? "Monthly revenue in Bangladeshi Taka (BDT)"
            : "Number of orders placed each month"}
        </p>
      </div>
    </div>
  );
}