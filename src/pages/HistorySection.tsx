import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUser } from "@clerk/clerk-react";
import { motion } from "framer-motion";
import { FileText } from "lucide-react";

import DynamicSidebar from "../components/Sidebar";
import AdminNavbar from "../components/UsersNavbar";

interface HistoryItem {
  _id: string;
  user_id: string;
  action: string;
  timestamp: number;
}

const HistorySection: React.FC = () => {
  const { user } = useUser();

  const convexUser = useQuery(
    api.userQueries.getUserByClerkId,
    user ? { clerkId: user.id } : "skip"
  );

  const historyData = useQuery(
    api.history.getHistory,
    convexUser?._id ? { userId: convexUser._id } : "skip"
  ) as HistoryItem[] | undefined;

  const formatTimeAgo = (timestamp?: number) => {
    if (!timestamp) return "Unknown";
    const diff = Date.now() - timestamp;
    if (diff < 3600000) return "Just now";
    if (diff < 86400000) return "Today";
    if (diff < 172800000) return "1 day ago";
    if (diff < 604800000) return `${Math.floor(diff / 86400000)} days ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-white to-teal-50">
        <p className="text-gray-500 text-lg">Loading user...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex min-h-screen bg-gradient-to-br from-white to-teal-50"
    >
      {/* Sidebar */}
      <DynamicSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <AdminNavbar />

        <main className="flex-1 p-6 overflow-auto">
          <motion.div
            className="bg-white p-6 rounded-2xl shadow-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Recent Activities</h2>
              <span className="text-xs px-2 py-1 bg-teal-100 text-teal-800 rounded-full">
                Last 7 days
              </span>
            </div>

            {/* Loading / Empty States */}
            {!historyData ? (
              <div className="py-8 text-center">
                <div className="inline-block p-3 bg-teal-100 rounded-full mb-4 animate-pulse">
                  <FileText className="h-6 w-6 text-teal-500" />
                </div>
                <p className="text-gray-600">Loading history...</p>
              </div>
            ) : historyData.length === 0 ? (
              <div className="py-8 text-center">
                <div className="inline-block p-3 bg-gray-100 rounded-full mb-4">
                  <FileText className="h-6 w-6 text-gray-500" />
                </div>
                <p className="text-gray-600">No history found.</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg">
                <ul className="divide-y divide-gray-200">
                  {historyData
                    .sort((a, b) => b.timestamp - a.timestamp)
                    .map((item) => (
                      <li
                        key={item._id}
                        className="px-4 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-teal-100">
                            <FileText className="w-5 h-5 text-teal-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-800">
                             {item.action}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatTimeAgo(item.timestamp)}
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </motion.div>
        </main>
      </div>
    </motion.div>
  );
};

export default HistorySection;
