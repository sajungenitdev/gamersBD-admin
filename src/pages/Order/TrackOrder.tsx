"use client";
import React, { useState } from "react";
import {
  Search,
  Package,
  Truck,
  MapPin,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Loader2,
  Calendar,
  CreditCard,
  User,
  Mail,
  Phone,
  MapPinIcon,
  ShoppingBag,
  ChevronRight,
  Home,
  Building2,
  PhoneCall,
  Mail as MailIcon,
  DollarSign,
  CalendarDays,
} from "lucide-react";
import Link from "next/link";

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
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  items: OrderItem[];
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
  shippingAddress: {
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
  };
  trackingNumber?: string;
  carrier?: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
  statusHistory?: Array<{
    status: string;
    note: string;
    updatedAt: string;
  }>;
  createdAt: string;
  deliveredAt?: string;
}

const TrackOrder = () => {
  const [orderNumber, setOrderNumber] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  // Get auth token (optional - for logged-in users)
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

  const trackOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim()) {
      setError("Please enter an order number");
      return;
    }

    setLoading(true);
    setError(null);
    setOrder(null);
    setSearched(true);

    try {
      const token = getAuthToken();
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      // Fetch all orders and find by order number
      const response = await fetch(
        "https://gamersbd-server.onrender.com/api/orders?page=1&limit=100",
        { headers },
      );

      if (response.status === 401) {
        setError("Please login to track orders");
        setLoading(false);
        return;
      }

      if (!response.ok) throw new Error("Failed to fetch orders");

      const data = await response.json();
      if (data.success) {
        const foundOrder = data.orders.find(
          (order: Order) => order.orderNumber === orderNumber.toUpperCase(),
        );

        if (foundOrder) {
          setOrder(foundOrder);
        } else {
          setError("Order not found. Please check your order number.");
        }
      } else {
        setError(data.message || "Failed to fetch order");
      }
    } catch (error) {
      console.error("Error tracking order:", error);
      setError("Failed to track order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    const statusMap: Record<
      string,
      { icon: any; color: string; bgColor: string; label: string }
    > = {
      pending: {
        icon: Clock,
        color: "text-yellow-600",
        bgColor: "bg-yellow-100",
        label: "Order Pending",
      },
      confirmed: {
        icon: CheckCircle,
        color: "text-blue-600",
        bgColor: "bg-blue-100",
        label: "Order Confirmed",
      },
      processing: {
        icon: Package,
        color: "text-purple-600",
        bgColor: "bg-purple-100",
        label: "Processing",
      },
      shipped: {
        icon: Truck,
        color: "text-indigo-600",
        bgColor: "bg-indigo-100",
        label: "Shipped",
      },
      in_transit: {
        icon: Truck,
        color: "text-cyan-600",
        bgColor: "bg-cyan-100",
        label: "In Transit",
      },
      out_for_delivery: {
        icon: Truck,
        color: "text-orange-600",
        bgColor: "bg-orange-100",
        label: "Out for Delivery",
      },
      delivered: {
        icon: CheckCircle,
        color: "text-green-600",
        bgColor: "bg-green-100",
        label: "Delivered",
      },
      cancelled: {
        icon: XCircle,
        color: "text-red-600",
        bgColor: "bg-red-100",
        label: "Cancelled",
      },
      refunded: {
        icon: AlertCircle,
        color: "text-gray-600",
        bgColor: "bg-gray-100",
        label: "Refunded",
      },
      on_hold: {
        icon: Clock,
        color: "text-amber-600",
        bgColor: "bg-amber-100",
        label: "On Hold",
      },
    };
    return statusMap[status] || statusMap.pending;
  };

  const getStepStatus = (orderStatus: string, stepStatus: string) => {
    const steps = [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "in_transit",
      "out_for_delivery",
      "delivered",
    ];
    const orderIndex = steps.indexOf(orderStatus);
    const stepIndex = steps.indexOf(stepStatus);

    if (orderIndex >= stepIndex) return "completed";
    return "pending";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getEstimatedDelivery = () => {
    if (order?.estimatedDelivery) {
      return new Date(order.estimatedDelivery).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
    if (order?.status === "delivered" && order.deliveredAt) {
      return `Delivered on ${formatDate(order.deliveredAt)}`;
    }
    const deliveryDate = new Date(order?.createdAt || Date.now());
    deliveryDate.setDate(deliveryDate.getDate() + 5);
    return deliveryDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header with Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Package className="w-8 h-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">GamersBD</span>
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Track Your Order
          </h1>
          <p className="text-gray-600">
            Enter your order number to get real-time delivery status
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <form
            onSubmit={trackOrder}
            className="flex flex-col sm:flex-row gap-4"
          >
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="Enter your order number (e.g., ORD-241211-0001)"
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
              Track Order
            </button>
          </form>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
        </div>

        {/* Order Details */}
        {order && (
          <div className="space-y-6">
            {/* Order Header Card */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl p-6 text-white">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <p className="text-blue-100 text-sm">Order Number</p>
                  <h2 className="text-2xl font-bold">{order.orderNumber}</h2>
                  <p className="text-blue-100 text-sm mt-1">
                    Placed on {formatDate(order.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {(() => {
                    const statusInfo = getStatusIcon(order.status);
                    const StatusIcon = statusInfo.icon;
                    return (
                      <div
                        className={`${statusInfo.bgColor} rounded-full px-4 py-2 flex items-center gap-2`}
                      >
                        <StatusIcon className={`w-5 h-5 ${statusInfo.color}`} />
                        <span
                          className={`font-semibold capitalize ${statusInfo.color}`}
                        >
                          {order.status?.replace(/_/g, " ")}
                        </span>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Delivery Progress Timeline */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-600" />
                Delivery Progress
              </h3>
              <div className="relative">
                <div className="flex justify-between mb-2">
                  {[
                    "pending",
                    "confirmed",
                    "processing",
                    "shipped",
                    "in_transit",
                    "out_for_delivery",
                    "delivered",
                  ].map((step, idx) => {
                    const stepStatus = getStepStatus(order.status, step);
                    const isCompleted = stepStatus === "completed";
                    const stepLabels = [
                      "Order Placed",
                      "Confirmed",
                      "Processing",
                      "Shipped",
                      "In Transit",
                      "Out for Delivery",
                      "Delivered",
                    ];

                    return (
                      <div
                        key={step}
                        className="flex flex-col items-center flex-1"
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            isCompleted
                              ? "bg-green-500 text-white"
                              : order.status === step
                                ? "bg-blue-500 text-white ring-4 ring-blue-200"
                                : "bg-gray-200 text-gray-400"
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <div className="w-2 h-2 rounded-full" />
                          )}
                        </div>
                        <p
                          className={`text-xs mt-2 text-center ${isCompleted ? "text-green-600 font-medium" : "text-gray-500"}`}
                        >
                          {stepLabels[idx]}
                        </p>
                      </div>
                    );
                  })}
                </div>
                <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 -z-10">
                  <div
                    className="h-full bg-green-500 transition-all duration-500"
                    style={{
                      width: `${((steps.indexOf(order.status) + 1) / 7) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Estimated Delivery */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl shadow-lg p-6 border border-green-200">
              <div className="flex items-center gap-3">
                <CalendarDays className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm text-green-700">
                    Estimated Delivery Date
                  </p>
                  <p className="text-xl font-bold text-green-800">
                    {getEstimatedDelivery()}
                  </p>
                </div>
              </div>
            </div>

            {/* Two Column Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Shipping Address */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPinIcon className="w-5 h-5 text-blue-600" />
                  Shipping Address
                </h3>
                <div className="space-y-1 text-gray-600">
                  <p className="font-medium text-gray-900">
                    {order.shippingAddress?.fullName}
                  </p>
                  <p>{order.shippingAddress?.addressLine1}</p>
                  {order.shippingAddress?.addressLine2 && (
                    <p>{order.shippingAddress.addressLine2}</p>
                  )}
                  <p>
                    {order.shippingAddress?.city},{" "}
                    {order.shippingAddress?.state}{" "}
                    {order.shippingAddress?.postalCode}
                  </p>
                  <p>{order.shippingAddress?.country}</p>
                  <p className="flex items-center gap-2 mt-2">
                    <Phone className="w-4 h-4" />
                    {order.shippingAddress?.phone}
                  </p>
                </div>
              </div>

              {/* Tracking Information */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-blue-600" />
                  Tracking Information
                </h3>
                {order.trackingNumber ? (
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Tracking Number</p>
                      <p className="font-semibold text-gray-900">
                        {order.trackingNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Carrier</p>
                      <p className="text-gray-900">{order.carrier}</p>
                    </div>
                    {order.trackingUrl && (
                      <a
                        href={order.trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Track Package <ChevronRight className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">
                      Tracking information will be available soon
                    </p>
                  </div>
                )}
              </div>

              {/* Customer Information */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Customer Information
                </h3>
                <div className="space-y-2">
                  <p className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900">{order.user?.name}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <MailIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{order.user?.email}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <PhoneCall className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">
                      {order.user?.phone || "N/A"}
                    </span>
                  </p>
                </div>
              </div>

              {/* Payment Information */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  Payment Information
                </h3>
                <div className="space-y-2">
                  <p className="flex items-center justify-between">
                    <span className="text-gray-600">Method:</span>
                    <span className="text-gray-900 capitalize">
                      {order.payment?.method?.replace(/_/g, " ")}
                    </span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span
                      className={`capitalize font-medium ${
                        order.payment?.status === "completed"
                          ? "text-green-600"
                          : order.payment?.status === "pending"
                            ? "text-yellow-600"
                            : "text-red-600"
                      }`}
                    >
                      {order.payment?.status}
                    </span>
                  </p>
                  {order.payment?.transactionId && (
                    <p className="flex items-center justify-between">
                      <span className="text-gray-600">Transaction ID:</span>
                      <span className="text-gray-900 text-sm">
                        {order.payment.transactionId}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-blue-600" />
                  Order Items ({order.items.length})
                </h3>
              </div>
              <div className="divide-y divide-gray-200">
                {order.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-6 flex flex-col sm:flex-row gap-4"
                  >
                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                      {item.product?.images?.[0] ? (
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">
                        {item.product?.name}
                      </h4>
                      <p className="text-sm text-gray-500 mt-1">
                        Platform: {item.platform} | Quantity: {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">
                        ৳{(item.priceAtTime * item.quantity).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        ৳{item.priceAtTime.toLocaleString()} each
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Summary */}
              <div className="p-6 bg-gray-50 border-t border-gray-200">
                <div className="flex justify-end">
                  <div className="w-72 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="text-gray-900">
                        ৳{order.subtotal.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Shipping:</span>
                      <span className="text-gray-900">
                        {order.shippingCost === 0
                          ? "Free"
                          : `৳${order.shippingCost.toLocaleString()}`}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax:</span>
                      <span className="text-gray-900">
                        ৳{order.tax.toLocaleString()}
                      </span>
                    </div>
                    {order.discount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Discount:</span>
                        <span>-৳{order.discount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200">
                      <span>Total:</span>
                      <span className="text-blue-600">
                        ৳{order.total.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Timeline */}
            {order.statusHistory && order.statusHistory.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  Order Timeline
                </h3>
                <div className="space-y-4">
                  {order.statusHistory.map((history, idx) => (
                    <div key={idx} className="flex gap-3">
                      <div className="relative">
                        <div className="w-3 h-3 mt-1 rounded-full bg-blue-500"></div>
                        {idx < order.statusHistory.length - 1 && (
                          <div className="absolute top-4 left-1 w-0.5 h-full bg-gray-300"></div>
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="font-medium text-gray-900 capitalize">
                          {history.status.replace(/_/g, " ")}
                        </p>
                        <p className="text-sm text-gray-500">{history.note}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDate(history.updatedAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Help Section */}
            <div className="bg-blue-50 rounded-2xl p-6 text-center">
              <h4 className="font-semibold text-gray-900 mb-2">Need Help?</h4>
              <p className="text-sm text-gray-600 mb-4">
                If you have any questions about your order, our support team is
                here to help.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-gray-50 transition border border-blue-200"
                >
                  <MailIcon className="w-4 h-4" />
                  Contact Support
                </a>
                <a
                  href="/faq"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition border border-gray-200"
                >
                  <AlertCircle className="w-4 h-4" />
                  FAQ
                </a>
              </div>
            </div>
          </div>
        )}

        {/* No Order Found */}
        {searched && !order && !loading && !error && (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Order Not Found
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              We couldn't find an order with the number "{orderNumber}". Please
              check the order number and try again.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackOrder;
