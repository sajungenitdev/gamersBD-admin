import React, { useState, useEffect } from "react";
import { 
  Search, 
  Eye, 
  Download, 
  CheckCircle, 
  Truck, 
  Package, 
  AlertCircle,
  DollarSign,
  Users,
  CreditCard,
  MapPin,
  TrendingUp,
  Clock,
  XCircle
} from "lucide-react";

interface Order {
  _id: string;
  orderNumber: string;
  user: {
    name: string;
    email: string;
    phone: string;
  };
  items: Array<{
    product: {
      name: string;
      price: number;
    };
    quantity: number;
    platform: string;
    priceAtTime: number;
  }>;
  subtotal: number;
  shippingCost: number;
  tax: number;
  discount: number;
  total: number;
  status: string;
  payment: {
    method: string;
    status: string;
    transactionId?: string;
  };
  createdAt: string;
  deliveredAt?: string;
  statusHistory?: Array<{
    status: string;
    note: string;
    updatedAt: string;
  }>;
  shippingAddress?: {
    fullName: string;
    addressLine1: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
  };
  trackingNumber?: string;
  carrier?: string;
}

const AllDeliveredOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState("newest");

  // Get token
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

  const getUserRole = () => {
    const sessionUserStr = sessionStorage.getItem("user");
    if (sessionUserStr) {
      try {
        const sessionUser = JSON.parse(sessionUserStr);
        return sessionUser.role;
      } catch (error) {}
    }
    
    try {
      const authUserStr = localStorage.getItem("authUser");
      if (authUserStr) {
        const authUser = JSON.parse(authUserStr);
        return authUser.user?.role;
      }
    } catch (error) {}
    
    return null;
  };

  const fetchOrders = async () => {
    const token = getAuthToken();
    const role = getUserRole();

    if (!token) {
      setError("No authentication token found. Please login again.");
      setLoading(false);
      return;
    }

    if (role !== "admin") {
      setError("Access denied. Admin privileges required.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        "https://gamersbd-server.onrender.com/api/orders?page=1&limit=100",
        {
          method: "GET",
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

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      if (data.success) {
        // Filter for delivered orders only
        const deliveredOrders = (data.orders || []).filter(
          (order: Order) => order.status === "delivered"
        );
        setOrders(deliveredOrders);
        setFilteredOrders(deliveredOrders);
      } else {
        setError(data.message || "Failed to fetch orders");
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      setError("Failed to load orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Apply filters and sorting
  useEffect(() => {
    let result = [...orders];

    // Search filter
    if (searchTerm) {
      result = result.filter(order =>
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sorting
    switch (sortBy) {
      case "newest":
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case "oldest":
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case "highest":
        result.sort((a, b) => b.total - a.total);
        break;
      case "lowest":
        result.sort((a, b) => a.total - b.total);
        break;
    }

    setFilteredOrders(result);
    setCurrentPage(1);
  }, [searchTerm, sortBy, orders]);

  const downloadInvoice = async (orderId: string) => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(
        `https://gamersbd-server.onrender.com/api/orders/${orderId}/invoice`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${orderId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Error downloading invoice:", error);
    }
  };

  const getPaymentBadge = (status: string) => {
    switch(status) {
      case "completed": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "failed": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ✅ FIXED: Calculate stats correctly without self-reference
  const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
  const totalItems = orders.reduce((sum, order) => sum + (order.items?.length || 0), 0);
  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
  const paymentCompleted = orders.filter(o => o.payment?.status === "completed").length;

  const stats = {
    total: orders.length,
    totalRevenue: totalRevenue,
    avgOrderValue: avgOrderValue,
    totalItems: totalItems,
    paymentCompleted: paymentCompleted,
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading delivered orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.href = "/login"}
            className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl hover:from-green-700 hover:to-teal-700 transition-all"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Delivered Orders</h1>
          <p className="text-gray-600">Track and manage all successfully delivered orders</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">Total Delivered</p>
                <p className="text-2xl font-bold text-green-600">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-purple-600">৳{stats.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">Avg. Order Value</p>
                <p className="text-2xl font-bold text-orange-600">৳{stats.avgOrderValue.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">Total Items Sold</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalItems}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">Payment Completed</p>
                <p className="text-2xl font-bold text-teal-600">{stats.paymentCompleted}</p>
              </div>
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-teal-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by order #, customer name, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest">Highest Amount</option>
                <option value="lowest">Lowest Amount</option>
              </select>
              <div className="text-sm text-gray-500 flex items-center">
                Total: {filteredOrders.length} delivered orders
              </div>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Order #</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Payment</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Delivered Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tracking</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No delivered orders found</p>
                    </td>
                  </tr>
                ) : (
                  currentOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">{order.orderNumber}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{order.user?.name}</div>
                        <div className="text-sm text-gray-500">{order.user?.email}</div>
                        <div className="text-xs text-gray-400">{order.user?.phone || 'No phone'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">৳{order.total.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">{order.items?.length || 0} items</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 capitalize">
                          {order.payment?.method?.replace(/_/g, " ")}
                        </div>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${getPaymentBadge(order.payment?.status || 'pending')}`}>
                          {order.payment?.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.deliveredAt ? formatDate(order.deliveredAt) : formatDate(order.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {order.trackingNumber ? (
                          <div>
                            <div className="text-sm text-gray-900">{order.trackingNumber}</div>
                            <div className="text-xs text-gray-500">{order.carrier}</div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">No tracking</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowDetailsModal(true);
                            }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => downloadInvoice(order._id)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition"
                            title="Download Invoice"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredOrders.length)} of {filteredOrders.length} delivered orders
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" onClick={() => setShowDetailsModal(false)} />
          <div className="relative min-h-screen flex items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">Order Details - {selectedOrder.orderNumber}</h3>
                <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-gray-600">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6">
                {/* Success Banner */}
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Order Successfully Delivered</h4>
                      <p className="text-sm text-gray-600">
                        Delivered on: {selectedOrder.deliveredAt ? formatDate(selectedOrder.deliveredAt) : formatDate(selectedOrder.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4" /> Customer Information
                    </h4>
                    <p className="text-sm"><strong>Name:</strong> {selectedOrder.user?.name}</p>
                    <p className="text-sm"><strong>Email:</strong> {selectedOrder.user?.email}</p>
                    <p className="text-sm"><strong>Phone:</strong> {selectedOrder.user?.phone || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <CreditCard className="w-4 h-4" /> Payment Information
                    </h4>
                    <p className="text-sm"><strong>Method:</strong> {selectedOrder.payment?.method?.replace(/_/g, ' ')}</p>
                    <p className="text-sm"><strong>Status:</strong> 
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${getPaymentBadge(selectedOrder.payment?.status || 'pending')}`}>
                        {selectedOrder.payment?.status}
                      </span>
                    </p>
                    {selectedOrder.payment?.transactionId && (
                      <p className="text-sm"><strong>Transaction ID:</strong> {selectedOrder.payment.transactionId}</p>
                    )}
                  </div>
                </div>

                {selectedOrder.shippingAddress && (
                  <div className="bg-gray-50 rounded-xl p-4 mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <MapPin className="w-4 h-4" /> Shipping Address
                    </h4>
                    <p className="text-sm">{selectedOrder.shippingAddress.fullName}</p>
                    <p className="text-sm">{selectedOrder.shippingAddress.addressLine1}</p>
                    <p className="text-sm">{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.postalCode}</p>
                    <p className="text-sm">{selectedOrder.shippingAddress.country}</p>
                    <p className="text-sm">Phone: {selectedOrder.shippingAddress.phone}</p>
                  </div>
                )}

                {/* Tracking Info */}
                {selectedOrder.trackingNumber && (
                  <div className="mb-6 p-4 bg-blue-50 rounded-xl">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Truck className="w-4 h-4" /> Tracking Information
                    </h4>
                    <p className="text-sm"><strong>Tracking Number:</strong> {selectedOrder.trackingNumber}</p>
                    <p className="text-sm"><strong>Carrier:</strong> {selectedOrder.carrier}</p>
                  </div>
                )}

                {/* Order Timeline */}
                {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4" /> Order Timeline
                    </h4>
                    <div className="space-y-3">
                      {selectedOrder.statusHistory.map((history, idx) => (
                        <div key={idx} className="flex gap-3 text-sm">
                          <div className="w-24 text-gray-500">
                            {formatDate(history.updatedAt)}
                          </div>
                          <div className="flex-1">
                            <span className="font-medium capitalize">{history.status}</span>
                            {history.note && (
                              <p className="text-gray-500 text-xs mt-1">{history.note}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <h4 className="font-semibold text-gray-900 mb-3">Order Items</h4>
                <div className="border rounded-xl overflow-hidden mb-6">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Product</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Platform</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Quantity</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Price</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedOrder.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-3 text-sm">{item.product?.name}</td>
                          <td className="px-4 py-3 text-sm">{item.platform}</td>
                          <td className="px-4 py-3 text-sm text-right">{item.quantity}</td>
                          <td className="px-4 py-3 text-sm text-right">৳{item.priceAtTime.toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm text-right">৳{(item.quantity * item.priceAtTime).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end">
                  <div className="w-64">
                    <div className="flex justify-between py-2">
                      <span className="text-sm text-gray-600">Subtotal:</span>
                      <span className="text-sm font-medium">৳{selectedOrder.subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-sm text-gray-600">Shipping:</span>
                      <span className="text-sm font-medium">{selectedOrder.shippingCost === 0 ? 'Free' : `৳${selectedOrder.shippingCost.toLocaleString()}`}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-sm text-gray-600">Tax:</span>
                      <span className="text-sm font-medium">৳{selectedOrder.tax.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-2 border-t border-gray-200 mt-2 pt-2">
                      <span className="font-semibold">Total:</span>
                      <span className="font-bold text-lg text-green-600">৳{selectedOrder.total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllDeliveredOrders;