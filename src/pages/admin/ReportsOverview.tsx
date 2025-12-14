// src/pages/admin/ReportsOverview.tsx
import { useState } from "react";
import { motion } from "framer-motion";
import { Line } from "react-chartjs-2";
import ReportsMetrics from "./AdminMetricsCard";
import ResponseModal from "../../components/ResponseModal";
import { Calendar, X } from "lucide-react";

interface ReportsOverviewProps {
  user: { full_name: string };
  chartSummary: any;
  chartData: any;
  lineChartOptions: any;
  chartRef: any;
  approvedBillings: any[];
  requests: any[];
  requestStats: any;
  designStats: any;
  getUserName: (id: string) => string;
  onDateRangeChange?: (startDate: string, endDate: string) => void;
}

const ReportsOverview: React.FC<ReportsOverviewProps> = ({
  user,
  chartSummary,
  chartData,
  lineChartOptions,
  chartRef,
  approvedBillings,
  requests,
  requestStats,
  designStats,
  getUserName,
  onDateRangeChange,
}) => {
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [responseModal, setResponseModal] = useState({
    isOpen: false,
    type: "success" as "success" | "error",
    title: "",
    message: "",
  });

  const handleApplyDateFilter = () => {
    if (startDate && endDate) {
      if (new Date(startDate) > new Date(endDate)) {
        setResponseModal({
          isOpen: true,
          type: "error",
          title: "Error",
          message: "Start date must be before end date",
        });
        return;
      }
      onDateRangeChange?.(startDate, endDate);
      setShowDateFilter(false);
    }
  };

  const handleClearDateFilter = () => {
    setStartDate("");
    setEndDate("");
    onDateRangeChange?.("", "");
    setShowDateFilter(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-6 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">Admin Reports</h1>
          <p className="text-xs sm:text-sm text-gray-500">
            Welcome back, {user.full_name}
          </p>
        </div>
      </div>
      <ReportsMetrics />

      {/* Main content: Chart + Right column */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Chart area */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-4 sm:p-6 shadow">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4">
            <div>
              <h3 className="text-base sm:text-lg font-semibold">Sales Trend</h3>
              <p className="text-xs sm:text-sm text-gray-500">
                Revenue trend for the selected period
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
              {/* Date Filter Button */}
              <button
                type="button"
                onClick={() => setShowDateFilter(!showDateFilter)}
                className="flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition text-xs sm:text-sm font-medium whitespace-nowrap"
              >
                <Calendar size={16} />
                Filter Dates
              </button>

              {/* Summary Stats */}
              <div className="text-left sm:text-right">
                <div className="text-xs text-gray-500">This period</div>
                <div className="text-lg sm:text-xl font-semibold">
                  ₱{chartSummary.thisSum.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">
                  Last: ₱{chartSummary.lastSum.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Date Filter Panel */}
          {showDateFilter && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex flex-col sm:flex-row items-end gap-2 sm:gap-3">
                <div className="flex-1 w-full">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    aria-label="Start date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div className="flex-1 w-full">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    aria-label="End date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleApplyDateFilter}
                  disabled={!startDate || !endDate}
                  className="w-full sm:w-auto px-3 sm:px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium"
                >
                  Apply
                </button>
                <button
                  type="button"
                  onClick={handleClearDateFilter}
                  className="w-full sm:w-auto px-3 sm:px-4 py-2 text-sm bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition font-medium flex items-center justify-center gap-2"
                >
                  <X size={16} />
                  Clear
                </button>
              </div>
            </motion.div>
          )}

          <div className="h-64 sm:h-80">
            <Line ref={chartRef} data={chartData} options={lineChartOptions} />
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4 sm:gap-6">
          {/* Conversion */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm sm:text-md font-semibold">Conversion Rate</h4>
              <div className="text-sm sm:text-base text-green-600 font-semibold">
                {requests.length === 0
                  ? "0%"
                  : `${Math.round(
                      (approvedBillings.length / requests.length) * 10000
                    ) / 100}%`}
              </div>
            </div>
            <div className="text-xs sm:text-sm text-gray-500 mb-3">
              Based on requests → approved billings
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">Checkout initiated</div>
                <div className="text-xs sm:text-sm font-medium">{requests.length}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">Completed purchases</div>
                <div className="text-xs sm:text-sm font-medium">
                  {approvedBillings.length}
                </div>
              </div>
            </div>
          </div>

          {/* Design Stats */}
          <div className="bg-white rounded-2xl p-3 sm:p-4 shadow divide-y">
            <div className="p-2 sm:p-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm sm:text-base font-semibold">Design Requests</h4>
                <div className="text-xs text-gray-500">
                  Total {requestStats.total}
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-center">
                <div className="bg-gray-50 p-2 rounded">
                  <div className="text-xs sm:text-sm font-semibold">
                    {requestStats.approved}
                  </div>
                  <div className="text-xs text-gray-500">Approved</div>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <div className="text-xs sm:text-sm font-semibold">
                    {requestStats.pending}
                  </div>
                  <div className="text-xs text-gray-500">Pending</div>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <div className="text-xs sm:text-sm font-semibold">
                    {requestStats.rejected}
                  </div>
                  <div className="text-xs text-gray-500">Rejected</div>
                </div>
              </div>
            </div>

            <div className="p-2 sm:p-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm sm:text-base font-semibold">Designs</h4>
                <div className="text-xs text-gray-500">
                  Total {designStats.total}
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-center">
                <div className="bg-gray-50 p-2 rounded">
                  <div className="text-xs sm:text-sm font-semibold">
                    {designStats.finished}
                  </div>
                  <div className="text-xs text-gray-500">Completed</div>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <div className="text-xs sm:text-sm font-semibold">
                    {designStats.approved}
                  </div>
                  <div className="text-xs text-gray-500">Approved</div>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <div className="text-xs sm:text-sm font-semibold">
                    {designStats.revisions}
                  </div>
                  <div className="text-xs text-gray-500">Revisions</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tables Section */}
      <section className="mt-4 sm:mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-3 sm:p-4 shadow">
          <h4 className="text-sm sm:text-base font-semibold mb-3">Recent Approved Billings</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="text-xs text-gray-500">
                <tr>
                  <th className="p-2">Client</th>
                  <th className="p-2">Designer</th>
                  <th className="p-2">Amount</th>
                  <th className="p-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {approvedBillings.slice(-8).reverse().map((b: any) => (
                  <tr
                    key={b._id}
                    className="border-t hover:bg-gray-50 transition"
                  >
                    <td className="p-2 truncate">
                      {getUserName(b.client_id ?? b.client)}
                    </td>
                    <td className="p-2 truncate">
                      {getUserName(b.designer_id ?? b.designer)}
                    </td>
                    <td className="p-2 font-medium text-gray-700 whitespace-nowrap">
                      ₱{Number(b.final_amount || 0).toLocaleString()}
                    </td>
                    <td className="p-2 text-gray-500 whitespace-nowrap">
                      {new Date(
                        b.created_at || b.createdAt || Date.now()
                      ).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {approvedBillings.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="p-4 text-center text-gray-500 text-xs sm:text-sm"
                    >
                      No approved billings yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-3 sm:p-4 shadow">
          <h4 className="text-sm sm:text-base font-semibold mb-3">Recent Requests</h4>
          <div className="space-y-2 text-xs sm:text-sm text-gray-700">
            {requests.slice(-6).reverse().map((r: any) => (
              <div key={r._id} className="p-2 bg-gray-50 rounded">
                <div className="font-medium truncate">{r.request_title || "Untitled"}</div>
                <div className="text-xs text-gray-500">
                  {r.status} •{" "}
                  {new Date(r.created_at || Date.now()).toLocaleDateString()}
                </div>
              </div>
            ))}
            {requests.length === 0 && (
              <div className="text-gray-500 text-xs sm:text-sm">No requests yet.</div>
            )}
          </div>
        </div>
      </section>

      <ResponseModal
        isOpen={responseModal.isOpen}
        type={responseModal.type}
        title={responseModal.title}
        message={responseModal.message}
        onClose={() => setResponseModal({ ...responseModal, isOpen: false })}
      />
    </motion.div>
  );
};

export default ReportsOverview;
