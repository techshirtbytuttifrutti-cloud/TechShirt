import React from "react";
import { Shirt, FileText, Calendar, User, Clock, type LucideIcon } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import type { RequestType } from "../RequestDetailsModal";

/* -------------------------
   Reusable Info Row
------------------------- */
const InfoRow = ({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string | React.ReactNode;
}) => (
  <div className="flex items-start gap-3">
    <div className="p-2 rounded-lg bg-gray-100 text-gray-600">
      <Icon size={18} />
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="text-base text-gray-900">{value}</p>
    </div>
  </div>
);

interface Props {
  request: RequestType;
  userType?: string;
  selectedDesigner: Id<"users"> | "";
  setSelectedDesigner: React.Dispatch<React.SetStateAction<Id<"users"> | "">>;
}

// Helper function to calculate days from today
const calculateDaysFromToday = (dateString?: string) => {
  if (!dateString) return null;

  try {
    const preferredDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    preferredDate.setHours(0, 0, 0, 0);

    const diffTime = preferredDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  } catch {
    return null;
  }
};

// Helper function to format deadline status
const formatDeadlineStatus = (daysLeft?: number | null) => {
  if (daysLeft === null || daysLeft === undefined) return "No deadline";

  if (daysLeft < 0) {
    return `${Math.abs(daysLeft)} days overdue`;
  } else if (daysLeft === 0) {
    return "Due today";
  } else if (daysLeft === 1) {
    return "Due tomorrow";
  } else {
    return `${daysLeft} days left`;
  }
};

const RequestDetailsSection: React.FC<Props> = ({
  request,
  userType,
  selectedDesigner,
  setSelectedDesigner,
}) => {
  const designers = useQuery(api.userQueries.listDesigners) || [];
  const isAdmin = userType?.toLowerCase() === "admin";

  // Fetch request sizes
  const requestSizes = useQuery(api.design_requests.getRequestSizes, {
    requestId: request._id
  }) || [];

  // Calculate deadline status
  const daysLeft = calculateDaysFromToday(request.preferred_date);
  const deadlineStatus = formatDeadlineStatus(daysLeft);
  const isOverdue = daysLeft !== null && daysLeft < 0;
  const isDueSoon = daysLeft !== null && daysLeft >= 0 && daysLeft <= 3;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800">Request Information</h3>
      <div className="space-y-4">
        <InfoRow icon={Shirt} label="Shirt Type" value={request.tshirt_type || "—"} />
        <InfoRow
          icon={FileText}
          label="Description"
          value={request.description || "No description provided."}
        />
        <InfoRow
          icon={User}
          label="Client"
          value={request.client?.full_name || "Anonymous"}
        />
        <InfoRow
          icon={Calendar}
          label="Created At"
          value={
            request.created_at
              ? new Date(request.created_at).toLocaleDateString()
              : "N/A"
          }
        />

        {/* Deadline */}
        {request.preferred_date && (
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-gray-100 text-gray-600">
              <Clock size={18} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Deadline</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-base text-gray-900">{new Date(request.preferred_date).toLocaleDateString()}</span>
                <span className={`text-xs font-medium px-2 py-1 rounded ${
                  isOverdue
                    ? 'bg-red-100 text-red-800'
                    : isDueSoon
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {deadlineStatus}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Shirt Sizes */}
        {requestSizes && requestSizes.length > 0 && (
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-gray-100 text-gray-600">
              <Shirt size={18} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500">Shirt Sizes</p>
              <div className="mt-2 space-y-1">
                {requestSizes.map((size: any, idx: number) => (
                  <div key={idx} className="text-sm text-gray-900">
                    {size.size_label && (
                      <span>
                        {size.size_label} × {size.quantity}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Designer Dropdown (admin only) */}
        {isAdmin && (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-500">
              Assign Designer <span className="text-red-500">*</span>
            </label>
            <select
              aria-label="Select a designer"
              value={selectedDesigner}
              onChange={(e) => setSelectedDesigner(e.target.value as Id<"users">)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="">Select a designer</option>
              {designers.length === 0 ? (
                <option disabled>Loading designers...</option>
              ) : (
                designers.map((designer) => (
                  <option key={designer._id} value={designer._id}>
                    {designer.firstName || designer.email}
                  </option>
                ))
              )}
            </select>
          </div>
        )}

        {/* Display currently selected designer */}
        {selectedDesigner && (
          <p className="text-sm text-gray-700">
            Currently selected:{" "}
            <span className="font-medium">
              {designers.find((d) => d._id === selectedDesigner)?.firstName ||
                designers.find((d) => d._id === selectedDesigner)?.email}
            </span>
          </p>
        )}
      </div>
    </div>
  );
};

export default RequestDetailsSection;
