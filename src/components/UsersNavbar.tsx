import { useState, useRef, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useUser, useClerk } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { FileText, Settings, LogOut } from "lucide-react";



type UserRecord = {
  _id: Id<"users">;
  email: string;
  firstName: string;
  lastName: string;
  role: "client" | "designer" | "admin";
  createdAt: number;
};


export default function UsersNavbar() {
  const { user } = useUser();
  const { openUserProfile, signOut } = useClerk();
  const navigate = useNavigate();

  const fullName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.fullName || "Client";

   const dbUser = useQuery(
      api.userQueries.getUserByClerkId,
      user?.id ? { clerkId: user.id } : "skip"
    ) as UserRecord | null | undefined;

  const role = (user?.unsafeMetadata?.userType as string) || "client";

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="sticky top-0 flex justify-between items-center bg-white shadow-sm px-6 py-3 z-10">

      {/* Left filler */}
      <div className="w-6" />

      {/* Center Logo */}
      <div className="absolute left-1/2 transform -translate-x-1/2">
        <h1 className="text-xl font-bold text-gray-800">TechShirt</h1>
      </div>

      {/* Right Section */}
      <div
        className="relative flex items-center space-x-3"
        ref={dropdownRef}
      >
        {/* Name & Role */}
        <div className="hidden sm:flex flex-col items-end leading-tight">
          <span className="text-gray-800 font-medium">{fullName}</span>
          <span className="text-xs text-teal-600 font-semibold">
            {role.toUpperCase()}
          </span>
        </div>

        {/* Avatar Button */}
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="w-8 h-8 rounded-full overflow-hidden border border-gray-300 hover:border-teal-500 transition-all flex items-center justify-center shadow-sm"
        >
          {user?.imageUrl ? (
            <img
              src={user.imageUrl}
              alt={fullName}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-gray-700 font-semibold">
              {fullName.charAt(0).toUpperCase()}
            </span>
          )}
        </button>

        {/* Dropdown */}
        {/* Dropdown */}
        {dropdownOpen && (
          <div className="
            absolute right-0 top-12 mt-2 
            w-90 bg-white rounded-xl 
            shadow-lg border border-gray-200 
            overflow-hidden z-20 pb-4
          ">
            {/* Header */}
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-3">
              {user?.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt={fullName}
                  className="w-12 h-12 rounded-full object-cover border border-gray-300 shadow-sm"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-semibold text-xl border border-gray-300">
                  {fullName.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Name & Email beside avatar */}
              <div className="flex flex-col">
                <span className="text-gray-900 font-medium text-sm">{fullName}</span>
                <span className="text-xs text-teal-600 font-semibold">{dbUser?.email}</span>
              </div>
            </div>

            {/* Options */}
            <div className="flex flex-col text-sm">
              <button
                onClick={() => {
                  openUserProfile();
                  setDropdownOpen(false);
                }}
                className="flex items-center gap-3 px-5 py-3 hover:bg-gray-100 transition text-gray-700"
              >
                <span className="text-[15px]"><Settings size={18} /></span> Manage account
              </button>

              <button
                onClick={() => {
                  navigate("/history");
                  setDropdownOpen(false);
                }}
                className="flex items-center gap-3 px-5 py-3 hover:bg-gray-100 transition text-gray-700"
              >
                <span className="text-[15px]"><FileText size={18} /></span> History / Logs
              </button>

              <button
                onClick={() => signOut()}
                className="flex items-center gap-3 px-5 py-3 hover:bg-red-50 transition text-red-600 border-t border-gray-200"
              >
                <span className="text-[15px]"><LogOut size={18} /></span> Sign out
              </button>
            </div>
          </div>
        )}

      </div>
    </nav>
  );
}
