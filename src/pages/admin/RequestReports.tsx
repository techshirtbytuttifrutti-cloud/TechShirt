import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { motion } from "framer-motion";
import { FileSpreadsheet, FileText, Filter, ChevronDown } from "lucide-react";

import { exportRequestToPDF } from "../utils/exportRequestToPdf";
import { exportRequestToExcel } from "../utils/exportRequestToExcel";

const AdminRequestReports: React.FC = () => {
  // ✅ Fetch from design_requests table instead of designs
  const requests = useQuery(api.design_requests.listAllRequests) || [];

  const [statusFilter, setStatusFilter] = useState("all");
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  // ✅ Filter requests by status
  const filteredRequests = useMemo(() => {
    if (statusFilter === "all") return requests;
    return requests.filter((r: any) => r.status === statusFilter);
  }, [requests, statusFilter]);

  // ✅ Format for table and export
  const formattedData = filteredRequests.map((r: any) => ({
    requestId: r._id,
    client: r.client?.full_name ?? "Unknown",
    title: r.request_title ?? "Untitled Request",
    tshirtType: r.tshirt_type ?? "N/A",
    printType: r.print_type ?? "N/A",
    description: r.description || "No details provided",
    status: r.status,
    createdAt: new Date(r.created_at || r._creationTime).toLocaleDateString(),
  }));

  return (
    <main>
      <motion.div
        className="bg-white shadow-md rounded-lg p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {/* Header */}
        <div className="mb-4">
          <div className="p-6 bg-white rounded-lg border border-slate-50 shadow-md w-full">
            {/* Header Row */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Design Request Reports</h1>
                <p className="text-gray-600">View and export all client design requests</p>
              </div>

              {/* Export Buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  title="Export PDF"
                  aria-label="Export PDF"
                  onClick={() =>
                    exportRequestToPDF(formattedData, "Design_Request_Report")
                  }
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-teal-600 border border-teal-500 rounded-lg hover:bg-teal-500 hover:text-white transition"
                >
                  <FileText size={18} /> Export as PDF
                </button>
                <button
                  title="Export Excel"
                  aria-label="Export Excel"
                  type="button"
                  onClick={() =>
                    exportRequestToExcel(formattedData, "Design_Request_Report")
                  }
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-teal-600 border border-teal-500 rounded-lg hover:bg-teal-500 hover:text-white transition"
                >
                  <FileSpreadsheet size={18} /> Export as Excel
                </button>
              </div>
            </div>

            {/* Filters - Dropdown on mobile, buttons on desktop */}
            <div className="mt-6">
              {/* Mobile Dropdown */}
              <div className="md:hidden relative">
                <button
                  type="button"
                  onClick={() => setShowMobileFilter(!showMobileFilter)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-2">
                    <Filter size={16} />
                    <span className="font-medium">
                      {statusFilter === "all" ? "All Statuses" : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                    </span>
                  </div>
                  <ChevronDown size={16} className={`transition-transform ${showMobileFilter ? "rotate-180" : ""}`} />
                </button>
                {showMobileFilter && (
                  <motion.div
                    className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-10"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    {["all", "pending", "approved", "declined", "cancelled"].map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => {
                          setStatusFilter(status);
                          setShowMobileFilter(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm transition ${
                          statusFilter === status
                            ? "bg-teal-50 text-teal-600 font-medium"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>

              {/* Desktop Buttons */}
              <div className="hidden md:flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <div className="flex items-center gap-2 text-gray-700 whitespace-nowrap">
                  <Filter size={16} />
                  <span className="text-xs sm:text-sm font-medium">Filter:</span>
                </div>
                <div className="flex gap-2">
                  {["all", "pending", "approved", "declined", "cancelled"].map(
                    (status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setStatusFilter(status)}
                        className={`px-3 py-1 text-xs sm:text-sm rounded-full border transition whitespace-nowrap ${
                          statusFilter === status
                            ? "bg-teal-500 text-white border-teal-500"
                            : "border-gray-300 text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Stats Summary */}
            <div className="mt-6 grid sm:grid-cols-2 gap-3 text-sm text-gray-600">
              <div>
                Total Requests:{" "}
                <span className="font-semibold text-gray-900">
                  {formattedData.length}
                </span>
              </div>
              <div>
                Approved:{" "}
                <span className="font-semibold text-teal-600">
                  {formattedData.filter((r: any) => r.status === "approved").length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-lg border border-slate-50 shadow-md overflow-x-auto w-full">
          {formattedData.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No design requests found</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full table-auto divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {[
                        "#",
                        "Client",
                        "Title",
                        "T-shirt Type",
                        "Print Type",
                        "Status",
                        "Date",
                        "Actions",
                      ].map((header) => (
                        <th
                          key={header}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {formattedData.map((r, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {idx + 1}
                        </td>
                        <td className="px-6 py-4">{r.client}</td>
                        <td className="px-6 py-4">{r.title}</td>
                        <td className="px-6 py-4">{r.tshirtType}</td>
                        <td className="px-6 py-4">{r.printType}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              r.status === "approved"
                                ? "bg-green-100 text-green-800"
                                : r.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : r.status === "rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {r.createdAt}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() =>
                                exportRequestToPDF([r], `Request_${idx + 1}`)
                              }
                              className="px-3 py-1 text-xs font-semibold bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition"
                            >
                              PDF
                            </button>
                            <button
                              onClick={() =>
                                exportRequestToExcel([r], `Request_${idx + 1}`)
                              }
                              className="px-3 py-1 text-xs font-semibold bg-teal-600 text-white rounded-md hover:bg-teal-700 transition"
                            >
                              Excel
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-4 p-4">
                {formattedData.map((r, idx) => (
                  <div key={idx} className="bg-white border rounded-lg p-4 shadow-sm">
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <div className="text-sm font-medium text-gray-900">Request #{idx + 1}</div>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 ${
                          r.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : r.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : r.status === "rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600 mb-3">
                      <div className="break-words"><span className="font-medium">Client:</span> {r.client}</div>
                      <div className="break-words"><span className="font-medium">Title:</span> {r.title}</div>
                      <div className="break-words"><span className="font-medium">T-shirt Type:</span> {r.tshirtType}</div>
                      <div className="break-words"><span className="font-medium">Print Type:</span> {r.printType}</div>
                      <div className="break-words"><span className="font-medium">Date:</span> {r.createdAt}</div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          exportRequestToPDF([r], `Request_${idx + 1}`)
                        }
                        className="flex-1 px-3 py-2 text-xs sm:text-sm bg-cyan-600 text-white rounded hover:bg-cyan-700 transition"
                      >
                        Export PDF
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          exportRequestToExcel([r], `Request_${idx + 1}`)
                        }
                        className="flex-1 px-3 py-2 text-xs sm:text-sm bg-teal-600 text-white rounded hover:bg-teal-700 transition"
                      >
                        Export Excel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </motion.div>
    </main>
  );
};

export default AdminRequestReports;
