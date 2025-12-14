import { FileText, ListOrdered } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";

export default function DashboardHeader() {
  const navigate = useNavigate();
  const { user } = useUser();

  const userName = user?.fullName || "Client";

  return (
    <div className="p-6 bg-white rounded-2xl shadow-md">
      <h1 className="text-2xl font-bold text-gray-900">Client Dashboard</h1>
      <p className="text-gray-600">Welcome back, {userName}!</p>

      {/* Buttons */}
      <div className="flex mt-6 gap-4 flex-wrap sm:flex-nowrap">
        {/* New Design Request */}
        <button
          onClick={() => navigate("/client/requests")}
          className="flex-1 sm:flex-none px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm text-teal-500 border-2 border-teal-500 rounded-lg hover:bg-teal-500 hover:text-white flex items-center justify-center gap-2"
        >
          <ListOrdered size={18} />
          <span className="hidden sm:inline">View My Request</span>
          <span className="sm:hidden">New Request</span>
        </button>

        {/* View All Requests */}
        <button
          onClick={() => navigate("/client/designs")}
          className="flex-1 sm:flex-none px-3 sm:px-6 py-3 sm:py-3 text-xs sm:text-sm text-teal-500 border-2 border-teal-500 rounded-lg hover:bg-teal-500 hover:text-white flex items-center justify-center gap-2"
        >
          <FileText size={18} />
          <span className="hidden sm:inline">My Orders</span>
          <span className="sm:hidden">View Orders</span>
        </button>
      </div>
    </div>
  );
}
