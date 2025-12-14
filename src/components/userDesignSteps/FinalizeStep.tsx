import React, { useRef } from "react";
import html2canvas from "html2canvas-pro"; // 👈 use html2canvas-pro if possible
import jsPDF from "jspdf";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { FileDown } from "lucide-react";

interface FinalizeDesignStepProps {
  design: {
    _id: Id<"design">;
    status: string;
    title?: string;
    description?: string;
    price?: number;
    createdAt?: number;
  };
}




const FinalizeDesignStep: React.FC<FinalizeDesignStepProps> = ({ design }) => {

  const billing = useQuery(api.billing.getBillingByDesign, {
    designId: design._id,
  });
  const clientInfo = useQuery(api.billing.getClientInfoByDesign, {
    designId: design._id,
  });

  const status = design.status;
  const isApproved = status === "approved";
  const isFinished =
    status === "finished" ||
    status === "in_production" ||
    status === "pending_pickup" ||
    status === "completed";

  // 🧾 Reference for invoice container
  const invoiceRef = useRef<HTMLDivElement>(null);

  if (!billing) {
    return (
      <div className="p-4 text-gray-600 text-sm">
        {isApproved
          ? "Loading billing details..."
          : "Billing is locked until your design is approved."}
      </div>
    );
  }

  const { breakdown, invoiceNo, createdAt } = billing;
  const displayTotal = billing?.starting_amount ?? breakdown.total ?? 0;

  // Get final negotiated amount
  const getFinalTotal = () => {
    if (!billing.final_amount || billing.final_amount === 0) {
      return displayTotal;
    }
    return billing.final_amount;
  };
  const finalTotal = getFinalTotal();

  // 📄 Capture and download the invoice section as PDF
  // 📄 Capture and download the invoice section as PDF
    const handleDownloadPDF = async () => {
      const invoice = invoiceRef.current;
      if (!invoice) return;

      // 🧩 Hide download button before capture
      const downloadBtn = invoice.querySelector("#download-btn") as HTMLElement;
      if (downloadBtn) downloadBtn.style.display = "none";

      try {
        // Temporarily scale invoice for better quality
        const originalTransform = invoice.style.transform;
        invoice.style.transform = "scale(1)";
        invoice.style.transformOrigin = "top left";

        const canvas = await html2canvas(invoice, {
          scale: 3, // Higher = sharper text
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false,
          scrollY: -window.scrollY, // Capture whole section even if scrolled
        });

        invoice.style.transform = originalTransform;

        const imgData = canvas.toDataURL("image/png", 1.0);
        const pdf = new jsPDF("p", "mm", "a4");

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        // If invoice taller than one page → auto split
        let heightLeft = pdfHeight;
        let position = 0;

        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();

        while (heightLeft > 0) {
          position = heightLeft - pdfHeight;
          pdf.addPage();
          pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
          heightLeft -= pdf.internal.pageSize.getHeight();
        }

        pdf.save(`Invoice_${String(invoiceNo).padStart(4, "0")}.pdf`);
      } catch (error) {
        console.error("PDF generation failed:", error);
        alert("⚠️ Failed to generate PDF. Please try again.");
      } finally {
        // ✅ Always show button again after capture (success or fail)
        if (downloadBtn) downloadBtn.style.display = "flex";
      }
    };


  return (
    <div className="p-2 sm:p-6 bg-white rounded-xl shadow-md space-y-3 sm:space-y-6 text-xs sm:text-sm" ref={invoiceRef}>
      {isFinished ? (
        <div>
          {/* ✅ Header */}
          <div className="flex justify-between items-center">
            <h2 className="text-lg sm:text-2xl font-bold text-gray-800">JCC Textile Printing Services</h2>
           <button
              type="button"
              id="download-btn" // 👈 add this line
              onClick={handleDownloadPDF}
              aria-label="Download invoice"
              title="Download Invoice"
              className="flex items-center justify-center gap-1 sm:gap-2 px-2 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:text-teal-600 transition text-xs sm:text-sm"
            >
              <FileDown size={16} className="sm:w-5 sm:h-5" />
              <span className="hidden sm:inline font-medium">Download PDF</span>
              <span className="sm:hidden font-medium">PDF</span>
            </button>
          </div>

          {/* ✅ Client Info */}
          <div className="flex flex-col sm:flex-row sm:justify-between mt-3 sm:mt-6 gap-3 sm:gap-0">
            <div>
              <h4 className="font-bold text-gray-700 mb-1 text-xs sm:text-sm">Billed To:</h4>
              <p className="text-xs sm:text-sm text-gray-700">
                {clientInfo
                  ? `${clientInfo.firstName} ${clientInfo.lastName}`
                  : "Client Name"}
              </p>
              <p className="text-xs text-gray-500">
                {clientInfo?.phone || "No contact number"}
              </p>
              <p className="text-xs text-gray-500 line-clamp-2">
                {clientInfo?.address || "No address provided"}
              </p>
            </div>

            <div className="sm:text-right">
              <p className="text-xs sm:text-sm font-medium text-gray-700">
                Invoice No:{" "}
                <span className="text-gray-900 font-semibold">
                  #{String(invoiceNo).padStart(4, "0")}
                </span>
              </p>
              <p className="text-xs sm:text-sm text-gray-700">
                Date:{" "}
                <span className="text-gray-900">
                  {new Date(createdAt).toLocaleDateString()}
                </span>
              </p>
            </div>
          </div>

          {/* ✅ Table */}
          <div className="mt-3 sm:mt-6 overflow-x-auto">
            <table className="w-full text-xs sm:text-sm border-t border-b border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-1 sm:py-2 px-1 sm:px-3 text-left">Item</th>
                  <th className="py-1 sm:py-2 px-1 sm:px-3 text-center">Qty</th>
                  <th className="py-1 sm:py-2 px-1 sm:px-3 text-center">Unit Price</th>
                  <th className="py-1 sm:py-2 px-1 sm:px-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-gray-200">
                  <td className="py-1 sm:py-2 px-1 sm:px-3">Printing</td>
                  <td className="text-center">{breakdown.shirtCount}</td>
                  <td className="text-center">₱{breakdown.printFee}</td>
                  <td className="text-right">
                    ₱{(breakdown.printFee * breakdown.shirtCount).toLocaleString()}
                  </td>
                </tr>
                {breakdown.revisionFee >= 0 && (
                  <tr className="border-t border-gray-200">
                    <td className="py-1 sm:py-2 px-1 sm:px-3">Revision Fee</td>
                    <td className="text-center">-</td>
                    <td className="text-center">₱{breakdown.revisionFee}</td>
                    <td className="text-right">₱{breakdown.revisionFee}</td>
                  </tr>
                )}
                {breakdown.designerFee >= 0 && (
                  <tr className="border-t border-gray-200">
                    <td className="py-1 sm:py-2 px-1 sm:px-3">Designer Fee</td>
                    <td className="text-center">-</td>
                    <td className="text-center">₱{breakdown.designerFee}</td>
                    <td className="text-right">₱{breakdown.designerFee}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ✅ Totals */}
          <div className="flex justify-end mt-3 sm:mt-6">
            <div className="w-full sm:w-1/2 text-xs sm:text-sm space-y-1">
              <div className="flex justify-between border-b border-gray-200 pb-1">
                <span>Subtotal</span>
                <span>₱{displayTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-1">
                <span>Tax/VAT (12%)</span>
                <span>₱{(displayTotal * 0.12).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-1">
                <span>Total</span>
                <span>₱{displayTotal.toLocaleString()}</span>
              </div>
              {finalTotal < displayTotal && (
                <div className="flex justify-between text-green-600 pb-1">
                  <span>Client Discount</span>
                  <span>-₱{(displayTotal - finalTotal).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-gray-800 text-sm sm:text-lg bg-gray-50 px-2 sm:px-3 py-1 sm:py-2 rounded-md">
                <span>Final Negotiated Price</span>
                <span>₱{finalTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>


           {/* Footer */}
            <div className="mt-4 sm:mt-8 text-center text-gray-600 text-xs sm:text-sm border-t pt-2 sm:pt-3">
              <p className="font-medium">Thank you for choosing TechShirt!</p>
              <p className="text-xs text-gray-500">
                Please keep this invoice for your records.
              </p>
              <p className="text-xs font-semibold text-gray-400 mt-1">
                Techshirt Management System © {new Date().getFullYear()}
              </p>
            </div>

        </div>
      ) : (
        <div className="p-4 border rounded-lg shadow-sm bg-gray-50 space-y-2 text-sm text-gray-700">
          <h2 className="text-lg font-semibold mb-2">Estimated Bill Breakdown</h2>
          <p>
            <span className="font-medium">Total Shirts:</span> {breakdown.shirtCount}
          </p>
          <p>
            <span className="font-medium">Printing Subtotal:</span> ₱
            {breakdown.printFee * breakdown.shirtCount}
          </p>
          <p>
            <span className="font-medium">Revision Fee:</span> ₱{breakdown.revisionFee}
          </p>
          <p>
            <span className="font-medium">Designer Fee:</span> ₱{breakdown.designerFee}
          </p>
          <hr className="my-2" />
          <p className="font-semibold text-gray-900">Total: ₱{breakdown.total}</p>
        </div>
      )}
    </div>
  );
};

export default FinalizeDesignStep;
