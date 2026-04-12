import React, { useState, useEffect } from "react";
import { 
  Search, 
  Eye, 
  Download, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Truck, 
  Package, 
  AlertCircle,
  RefreshCw,
  DollarSign,
  Users,
  ShoppingBag,
  CreditCard,
  MapPin,
  Filter,
  ThumbsUp,
  ThumbsDown,
  Loader2
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
  shippingAddress?: {
    fullName: string;
    addressLine1: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
  };
}

const AllPendingOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [processingAction, setProcessingAction] = useState<string | null>(null);

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
        const pendingOrders = (data.orders || []).filter(
          (order: Order) => order.status === "pending"
        );
        setOrders(pendingOrders);
        setFilteredOrders(pendingOrders);
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

  // Apply filters
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

    // Payment filter
    if (paymentFilter !== "all") {
      result = result.filter(order => order.payment?.status === paymentFilter);
    }

    setFilteredOrders(result);
    setCurrentPage(1);
  }, [searchTerm, paymentFilter, orders]);

  // Approve order (confirm)
  const approveOrder = async (orderId: string) => {
    setProcessingAction(orderId);
    const token = getAuthToken();
    
    try {
      const response = await fetch(
        `https://gamersbd-server.onrender.com/api/orders/${orderId}/status`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            status: "confirmed", 
            note: "Order approved by admin" 
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to approve order");

      const data = await response.json();
      if (data.success) {
        // Remove from pending list
        setOrders(prev => prev.filter(order => order._id !== orderId));
        setFilteredOrders(prev => prev.filter(order => order._id !== orderId));
        alert("Order approved successfully!");
      }
    } catch (error) {
      console.error("Error approving order:", error);
      alert("Failed to approve order");
    } finally {
      setProcessingAction(null);
    }
  };

  // Reject/Cancel order
  const rejectOrder = async (orderId: string) => {
    if (!confirm("Are you sure you want to reject this order?")) return;
    
    setProcessingAction(orderId);
    const token = getAuthToken();
    
    try {
      const response = await fetch(
        `https://gamersbd-server.onrender.com/api/orders/${orderId}/status`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            status: "cancelled", 
            note: "Order rejected by admin" 
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to reject order");

      const data = await response.json();
      if (data.success) {
        setOrders(prev => prev.filter(order => order._id !== orderId));
        setFilteredOrders(prev => prev.filter(order => order._id !== orderId));
        alert("Order rejected successfully!");
      }
    } catch (error) {
      console.error("Error rejecting order:", error);
      alert("Failed to reject order");
    } finally {
      setProcessingAction(null);
    }
  };

  // Update payment status to completed
  const confirmPayment = async (orderId: string) => {
    setProcessingAction(orderId);
    const token = getAuthToken();
    
    try {
      const response = await fetch(
        `https://gamersbd-server.onrender.com/api/orders/${orderId}/payment`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            paymentStatus: "completed",
            note: "Payment confirmed by admin"
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to update payment");

      const data = await response.json();
      if (data.success) {
        // Update local state
        setOrders(prev => prev.map(order => 
          order._id === orderId 
            ? { ...order, payment: { ...order.payment, status: "completed" } }
            : order
        ));
        setFilteredOrders(prev => prev.map(order => 
          order._id === orderId 
            ? { ...order, payment: { ...order.payment, status: "completed" } }
            : order
        ));
        alert("Payment confirmed successfully!");
      }
    } catch (error) {
      console.error("Error confirming payment:", error);
      alert("Failed to confirm payment");
    } finally {
      setProcessingAction(null);
    }
  };

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

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  const stats = {
    total: orders.length,
    paymentPending: orders.filter(o => o.payment?.status === "pending").length,
    paymentCompleted: orders.filter(o => o.payment?.status === "completed").length,
    totalRevenue: orders.reduce((sum, order) => sum + (order.total || 0), 0),
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading pending orders...</p>
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
            className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:from-orange-700 hover:to-red-700 transition-all"
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
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Pending Orders</h1>
          <p className="text-gray-600">Review and manage pending customer orders</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">Total Pending</p>
                <p className="text-2xl font-bold text-orange-600">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">Payment Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.paymentPending}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">Payment Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.paymentCompleted}</p>
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
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
              >
                <option value="all">All Payments</option>
                <option value="pending">Payment Pending</option>
                <option value="completed">Payment Completed</option>
              </select>
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
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No pending orders found</p>
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
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2 flex-wrap">
                          {/* View Details */}
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

                          {/* Confirm Payment (if payment pending) */}
                          {order.payment?.status === "pending" && (
                            <button
                              onClick={() => confirmPayment(order._id)}
                              disabled={processingAction === order._id}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition disabled:opacity-50"
                              title="Confirm Payment"
                            >
                              {processingAction === order._id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <ThumbsUp className="w-4 h-4" />
                              )}
                            </button>
                          )}

                          {/* Approve Order */}
                          <button
                            onClick={() => approveOrder(order._id)}
                            disabled={processingAction === order._id}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition disabled:opacity-50"
                            title="Approve Order"
                          >
                            {processingAction === order._id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                          </button>

                          {/* Reject Order */}
                          <button
                            onClick={() => rejectOrder(order._id)}
                            disabled={processingAction === order._id}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                            title="Reject Order"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>

                          {/* Download Invoice */}
                          <button
                            onClick={() => downloadInvoice(order._id)}
                            className="p-1.5 text-gray-600 hover:bg-gray-50 rounded-lg transition"
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
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredOrders.length)} of {filteredOrders.length} pending orders
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
                      <span className="font-bold text-lg text-orange-600">৳{selectedOrder.total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons in Modal */}
                <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => approveOrder(selectedOrder._id)}
                    disabled={processingAction === selectedOrder._id}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve Order
                  </button>
                  <button
                    onClick={() => rejectOrder(selectedOrder._id)}
                    disabled={processingAction === selectedOrder._id}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject Order
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllPendingOrders;