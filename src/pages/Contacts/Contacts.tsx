"use client";
import React, { useState, useEffect } from "react";
import {
  EyeIcon,
  TrashBinIcon,
  EnvelopeIcon,
} from "../../icons";
import {
  MagnifyingGlassIcon,
  DocumentArrowDownIcon,
  ArrowPathIcon,
  CheckBadgeIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { useAuth } from "../../context/AuthContext";

interface Contact {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "pending" | "read" | "replied" | "archived";
  createdAt: string;
  ipAddress?: string;
  userAgent?: string;
  replyMessage?: string;
  repliedAt?: string;
}

const Contacts = () => {
  const { token } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modal states
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Toast notification
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 3000);
  };

  // Fetch contacts
  const fetchContacts = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await fetch("https://gamersbd-server.onrender.com/api/contacts", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch contacts");
      }

      setContacts(data.data);
    } catch (error) {
      console.error("Fetch contacts error:", error);
      showToast(
        error instanceof Error ? error.message : "Failed to load contacts",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchContacts();
    }
  }, [token]);

  // Update contact status
  const updateContactStatus = async (id: string, status: string) => {
    if (!token) return;

    try {
      const response = await fetch(
        `https://gamersbd-server.onrender.com/api/contacts/${id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update status");
      }

      // Update local state
      setContacts(
        contacts.map((contact) =>
          contact._id === id ? { ...contact, status: status as any } : contact
        )
      );

      showToast(`Status updated to ${status}`, "success");
    } catch (error) {
      console.error("Update status error:", error);
      showToast(
        error instanceof Error ? error.message : "Failed to update status",
        "error"
      );
    }
  };

  // Delete contact
  const handleDeleteContact = async () => {
    if (!token || !selectedContact) return;

    try {
      const response = await fetch(
        `https://gamersbd-server.onrender.com/api/contacts/${selectedContact._id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete contact");
      }

      setContacts(contacts.filter((c) => c._id !== selectedContact._id));
      showToast("Contact message deleted successfully", "success");
      setIsDeleteModalOpen(false);
      setSelectedContact(null);
    } catch (error) {
      console.error("Delete contact error:", error);
      showToast(
        error instanceof Error ? error.message : "Failed to delete contact",
        "error"
      );
    }
  };

  // Filter contacts
  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      contact.name.toLowerCase().includes(search.toLowerCase()) ||
      contact.email.toLowerCase().includes(search.toLowerCase()) ||
      contact.subject.toLowerCase().includes(search.toLowerCase()) ||
      contact.message.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || contact.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "read":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "replied":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "archived":
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ["Name", "Email", "Subject", "Message", "Status", "Date"];
    const csvData = filteredContacts.map((contact) => [
      contact.name,
      contact.email,
      contact.subject,
      contact.message.replace(/,/g, " "),
      contact.status,
      formatDate(contact.createdAt),
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contacts_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading && contacts.length === 0) {
    return (
      <>
        <PageMeta title="Contacts | Admin" description="Manage contact messages" />
        <PageBreadcrumb pageTitle="Contact Messages" />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta title="Contacts | Admin" description="Manage contact messages" />
      <PageBreadcrumb pageTitle="Contact Messages" />

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-4 right-4 z-[100] p-4 rounded-lg shadow-lg transition-all transform animate-slide-in">
          <div
            className={`flex items-center gap-2 p-3 rounded-lg ${
              toast.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            <div className="flex-1">
              <p className="text-sm font-medium">{toast.message}</p>
            </div>
            <button
              onClick={() =>
                setToast({ show: false, message: "", type: "success" })
              }
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Header Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Total Messages
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {contacts.length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">
              {contacts.filter((c) => c.status === "pending").length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">Read</p>
            <p className="text-2xl font-bold text-blue-600">
              {contacts.filter((c) => c.status === "read").length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">Replied</p>
            <p className="text-2xl font-bold text-green-600">
              {contacts.filter((c) => c.status === "replied").length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">Archived</p>
            <p className="text-2xl font-bold text-gray-600">
              {contacts.filter((c) => c.status === "archived").length}
            </p>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, subject..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="read">Read</option>
                <option value="replied">Replied</option>
                <option value="archived">Archived</option>
              </select>

              <button
                onClick={fetchContacts}
                className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                title="Refresh"
              >
                <ArrowPathIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>

              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
              >
                <DocumentArrowDownIcon className="w-5 h-5" />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Contacts Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50 border-y border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    From
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Message Preview
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Received
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredContacts.length > 0 ? (
                  filteredContacts.map((contact) => (
                    <tr
                      key={contact._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {contact.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {contact.email}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900 dark:text-white font-medium">
                          {contact.subject}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 max-w-xs">
                          {contact.message}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(
                              contact.status
                            )}`}
                          >
                            {contact.status}
                          </span>
                          {contact.status === "pending" && (
                            <button
                              onClick={() =>
                                updateContactStatus(contact._id, "read")
                              }
                              className="text-blue-600 hover:text-blue-800 text-xs"
                              title="Mark as read"
                            >
                              <CheckBadgeIcon className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(contact.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedContact(contact);
                              setIsViewModalOpen(true);
                            }}
                            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/30 rounded-full transition"
                            title="View message"
                          >
                            <EyeIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedContact(contact);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/30 rounded-full transition"
                            title="Delete message"
                          >
                            <TrashBinIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <EnvelopeIcon className="w-12 h-12 text-gray-400 mb-3" />
                        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                          {search
                            ? "No messages found matching your search"
                            : "No contact messages yet"}
                        </p>
                        {search && (
                          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                            Try adjusting your search
                          </p>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* View Message Modal */}
      {isViewModalOpen && selectedContact && (
        <ViewMessageModal
          contact={selectedContact}
          onClose={() => {
            setIsViewModalOpen(false);
            setSelectedContact(null);
          }}
          onUpdateStatus={(status) => {
            updateContactStatus(selectedContact._id, status);
            setIsViewModalOpen(false);
            setSelectedContact(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedContact && (
        <DeleteContactModal
          contact={selectedContact}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setSelectedContact(null);
          }}
          onConfirm={handleDeleteContact}
        />
      )}
    </>
  );
};

// View Message Modal Component
const ViewMessageModal = ({
  contact,
  onClose,
  onUpdateStatus,
}: {
  contact: Contact;
  onClose: () => void;
  onUpdateStatus: (status: string) => void;
}) => {
  const [replyText, setReplyText] = useState("");
  const [isReplying, setIsReplying] = useState(false);

  const handleSendReply = async () => {
    if (!replyText.trim()) return;

    setIsReplying(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `https://gamersbd-server.onrender.com/api/contacts/${contact._id}/reply`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ replyMessage: replyText }),
        }
      );

      if (response.ok) {
        onUpdateStatus("replied");
      }
    } catch (error) {
      console.error("Error sending reply:", error);
    } finally {
      setIsReplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Contact Message Details
                </h3>
                <button
                  onClick={onClose}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Sender Info */}
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  From
                </h4>
                <div className="space-y-1">
                  <p className="text-gray-900 dark:text-white font-medium">
                    {contact.name}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    {contact.email}
                  </p>
                </div>
              </div>

              {/* Subject */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Subject
                </h4>
                <p className="text-gray-900 dark:text-white font-medium">
                  {contact.subject}
                </p>
              </div>

              {/* Message */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Message
                </h4>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {contact.message}
                  </p>
                </div>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Status:</span>
                  <span className="ml-2 capitalize">{contact.status}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Received:</span>
                  <span className="ml-2">
                    {new Date(contact.createdAt).toLocaleString()}
                  </span>
                </div>
                {contact.ipAddress && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">IP Address:</span>
                    <span className="ml-2">{contact.ipAddress}</span>
                  </div>
                )}
              </div>

              {/* Reply Section */}
              {contact.status !== "replied" && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Reply to {contact.name}
                  </h4>
                  <textarea
                    rows={4}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-gray-900 dark:text-white"
                    placeholder="Type your reply here..."
                  />
                  <div className="flex justify-end gap-3 mt-3">
                    <button
                      onClick={() => onUpdateStatus("read")}
                      className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 transition"
                    >
                      Mark as Read
                    </button>
                    <button
                      onClick={handleSendReply}
                      disabled={!replyText.trim() || isReplying}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition disabled:opacity-50"
                    >
                      {isReplying ? "Sending..." : "Send Reply"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Delete Contact Modal Component
const DeleteContactModal = ({
  contact,
  onClose,
  onConfirm,
}: {
  contact: Contact;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) => {
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      await onConfirm();
    } catch (error) {
      console.error("Error deleting contact:", error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                <TrashBinIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Delete Contact Message
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Are you sure you want to delete the message from{" "}
                <strong>{contact.name}</strong>?
              </p>
              <p className="text-xs text-red-500 mb-6">
                This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition disabled:opacity-50"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contacts;