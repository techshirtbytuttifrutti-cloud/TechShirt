import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import AdminNavbar from "../components/UsersNavbar";
import DynamicSidebar from "../components/Sidebar";
import { useUser } from "@clerk/clerk-react";
import { CheckCircle, AlertTriangle, Trash2, Search } from "lucide-react";
import { formatTimeAgo } from "./utils/convexUtils";


interface Notification {
  id: any; // Id<"notifications"> from Convex (use `any` or proper Id type)
  notif_content: string;
  is_read?: boolean;
  created_at?: number;
}


const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const { user: clerkUser, isLoaded } = useUser();
  const [userId, setUserId] = useState<string | null>(null);
  const [_userRole, setUserRole] = useState<"admin" | "designer" | "client" | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");


  // Fetch current user from Convex users table by Clerk ID
  const userRecord = useQuery(api.userQueries.getUserByClerkId, clerkUser ? { clerkId: clerkUser.id } : "skip");

  useEffect(() => {
  if (!isLoaded) return; // Wait for Clerk to load user session

  if (!clerkUser) {
    navigate("/sign-in");
    return;
  }

  if (userRecord) {
    setUserId(userRecord._id);
    setUserRole(userRecord.role);
    setIsLoading(false);
  } else if (userRecord === undefined) {
    return; // still loading Convex data
  } else {
    setError("Could not retrieve your user data. Please log in again.");
    localStorage.removeItem("user");
    navigate("/sign-in");
  }
}, [isLoaded, clerkUser, userRecord, navigate]);


  // Fetch notifications for the current user
  const notificationsRaw = useQuery(
    api.notifications.getUserNotifications,
    userId ? { userId: userId as any } : "skip" // cast string → Id<"users">
  ) || [];

  // Map Convex fields to local Notification interface
  const notifications: Notification[] = notificationsRaw.map((n: any) => ({
    id: n.id,                 // <- use server's `id`
    notif_content: n.content, // <- server returns `content`
    is_read: n.isRead ?? false,
    created_at: n.createdAt ?? null,
  }));

  // Mutations
  const markAsReadMutation = useMutation(api.notifications.markNotificationAsRead);
  const markAllAsReadMutation = useMutation(api.notifications.markAllNotificationsAsRead);
  const deleteNotificationMutation = useMutation(api.notifications.deleteNotification);

  const deleteNotification = async (id: any) => {
      try {
        const res = await deleteNotificationMutation({ notificationId: id });
        if (!res || !res.success) {
          console.error("Failed to delete notification:", res?.error ?? res);
          // optionally show user feedback / toast
        } else {
          console.log("Deleted notification", id);
        }
      } catch (err) {
        console.error("Error deleting notification:", err);
      }
    };

  const markAsRead = async (id: any) => {
      try {
        const res = await markAsReadMutation({ notificationId: id });
        if (!res || !res.success) {
          console.error("Failed to mark as read:", res?.error ?? res);
        }
      } catch (err) {
        console.error("Error marking notification as read:", err);
      }
    };


  const markAllAsRead = async () => {
    if (!userId) return;
    try {
      await markAllAsReadMutation({ userId: userId as any }); // cast string → Id<"users">
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  };

    const filteredNotifications = useMemo(() => {
    return notifications.filter((n) =>
      n.notif_content.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [notifications, searchTerm]);

  if (isLoading) {
      return (
        <div className="flex h-screen bg-gray-50">
          <DynamicSidebar />
          <div className="flex-1 flex flex-col">
            <AdminNavbar />
            <div className="flex-1 p-6 flex items-center justify-center">
              <div className="bg-white shadow rounded-lg p-6 text-center">
                <p className="text-gray-500">Loading requests...</p>
              </div>
            </div>
          </div>
        </div>
      );
    }


  if (error) {
    return (
      <div  className="flex min-h-screen bg-gradient-to-br from-white to-teal-50">
        <DynamicSidebar />
        <div className="flex-1 flex flex-col">
          <AdminNavbar />
          <main className="p-6 md:p-8 flex flex-col items-center justify-center">
            <div className="bg-white p-8 rounded-2xl shadow-md text-center max-w-md w-full">
              <div className="p-4 bg-red-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <AlertTriangle size={36} className="text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <button type="button" onClick={() => navigate("/sign-in")} className="px-6 py-2.5 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors font-medium">
                Go to Login
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-white to-teal-50">
      <DynamicSidebar />
      <div className="flex-1 flex flex-col">
        <AdminNavbar />
        <main className="p-4 sm:p-6 md:p-8 flex flex-col gap-4 sm:gap-6 overflow-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
          {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                <p className="text-gray-600 text-sm mt-1">
                  Stay updated with your latest account activities
                </p>
              </div>
              <div className="mt-4 sm:mt-0 flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-200 text-sm"
                />
                <Search className="absolute h-4 w-4 text-gray-400 ml-3" />
                {notifications.some((n) => !n.is_read) && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="bg-teal-100 text-teal-700 px-4 py-2 rounded-lg hover:bg-teal-200 transition-colors text-sm"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notification
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredNotifications.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-gray-500">
                        No notifications found
                      </td>
                    </tr>
                  ) : (
                    filteredNotifications.map((notification) => (
                      <tr
                        key={notification.id}
                        className={`transition-all hover:bg-gray-50 ${
                          notification.is_read ? "" : "bg-teal-50"
                        }`}
                      >
                        <td className="px-3 py-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              notification.is_read
                                ? "bg-gray-100 text-gray-700"
                                : "bg-teal-100 text-teal-700"
                            }`}
                          >
                            {notification.is_read ? "Read" : "New"}
                          </span>
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-800">{notification.notif_content}</td>
                        <td className="px-3 py-4 text-sm text-gray-500">
                          {notification.created_at ? formatTimeAgo(notification.created_at) : ""}
                        </td>
                        <td className="px-3 py-4 flex justify-center gap-2">
                          {!notification.is_read && (
                            <button
                              type="button"
                              onClick={() => markAsRead(notification.id)}
                              className="text-teal-600 hover:text-teal-800 p-1.5 rounded-full hover:bg-teal-100 transition-colors"
                              title="Mark as read"
                            >
                              <CheckCircle className="h-5 w-5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => deleteNotification(notification.id)}
                            className="text-red-600 hover:text-red-800 p-1.5 rounded-full hover:bg-red-100 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500 bg-white rounded-lg">
                  No notifications found
                </div>
              ) : (
                filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border transition-all ${
                      notification.is_read
                        ? "bg-white border-gray-200"
                        : "bg-teal-50 border-teal-200"
                    }`}
                  >
                    {/* Status Badge */}
                    <div className="flex items-start justify-between mb-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          notification.is_read
                            ? "bg-gray-100 text-gray-700"
                            : "bg-teal-100 text-teal-700"
                        }`}
                      >
                        {notification.is_read ? "Read" : "New"}
                      </span>
                      <span className="text-xs text-gray-500">
                        {notification.created_at ? formatTimeAgo(notification.created_at) : ""}
                      </span>
                    </div>

                    {/* Notification Content */}
                    <p className="text-sm text-gray-800 mb-4 leading-relaxed">
                      {notification.notif_content}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      {!notification.is_read && (
                        <button
                          type="button"
                          onClick={() => markAsRead(notification.id)}
                          className="flex-1 flex items-center justify-center gap-2 text-teal-600 bg-teal-50 hover:bg-teal-100 p-2 rounded-lg transition-colors text-sm font-medium"
                          title="Mark as read"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Mark as read
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => deleteNotification(notification.id)}
                        className={`flex-1 flex items-center justify-center gap-2 text-red-600 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors text-sm font-medium ${
                          !notification.is_read ? "" : "flex-1"
                        }`}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default Notifications;
