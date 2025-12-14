import React from "react";
import { X } from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";


interface DesignHeaderProps {
  designId?: Id<"design">; // allow undefined
  onClose: () => void;
}

const DesignHeader: React.FC<DesignHeaderProps> = ({ onClose }) => {
  return (
    <div className="flex justify-between items-center border-b pb-2 sm:pb-3 mb-3 sm:mb-4">
      <h2 className="text-lg sm:text-xl font-semibold truncate">Design Details</h2>
      <button
        aria-label="Close"
        onClick={onClose}
        className="text-gray-500 hover:text-gray-700 flex-shrink-0"
      >
        <X size={20} />
      </button>
    </div>
  );
};

export default DesignHeader;
