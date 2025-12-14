import { useNavigate } from "react-router-dom";
import { FileText, Users } from "lucide-react";
import { useUser } from "@clerk/clerk-react";


export default function HeaderSection() {
  const navigate = useNavigate();
  const { user } = useUser();

  const userName = user?.fullName || "Admin";


 return (
    <div className="p-6 bg-white rounded-2xl shadow-md">
      <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
      <p className="text-gray-600">Welcome back, {userName}!</p>

      {/* Buttons */}
      <div className="flex mt-6 gap-4 flex-wrap sm:flex-nowrap">
        <button
          onClick={() => navigate('/admin/requests')}
          className="flex-1 sm:flex-none px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm text-teal-500 border-2 border-teal-500 rounded-lg hover:bg-teal-500 hover:text-white flex items-center justify-center gap-2"
        >
          <FileText size={18} />
          <span className="hidden sm:inline">View All Request</span>
          <span className="sm:hidden">View Request</span>
        </button>

        {/* View All Requests */}
        <button
           onClick={() => navigate('/admin/users')}
          className="flex-1 sm:flex-none px-3 sm:px-6 py-3 sm:py-3 text-xs sm:text-sm text-teal-500 border-2 border-teal-500 rounded-lg hover:bg-teal-500 hover:text-white flex items-center justify-center gap-2"
        >
          <Users size={18} />
          <span className="hidden sm:inline">Manage Users</span>
          <span className="sm:hidden">Manage Users </span>
        </button>
      </div>
    </div>
  );
}
