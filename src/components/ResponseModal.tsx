import React from "react";
import { motion } from "framer-motion";
import { CheckCircle, AlertCircle, X } from "lucide-react";

interface ResponseModalProps {
  isOpen: boolean;
  type: "success" | "error";
  title: string;
  message: string;
  onClose: () => void;
  autoClose?: boolean;
  autoCloseDuration?: number;
}

const ResponseModal: React.FC<ResponseModalProps> = ({
  isOpen,
  type,
  title,
  message,
  onClose,
  autoClose = true,
  autoCloseDuration = 3000,
}) => {
  React.useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(onClose, autoCloseDuration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, autoCloseDuration, onClose]);

  if (!isOpen) return null;

  const isSuccess = type === "success";
  const bgColor = isSuccess ? "bg-green-50" : "bg-red-50";
  const borderColor = isSuccess ? "border-green-200" : "border-red-200";
  const textColor = isSuccess ? "text-green-800" : "text-red-800";
  const titleColor = isSuccess ? "text-green-900" : "text-red-900";
  const buttonColor = isSuccess
    ? "bg-green-600 hover:bg-green-700"
    : "bg-red-600 hover:bg-red-700";
  const Icon = isSuccess ? CheckCircle : AlertCircle;

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className={`${bgColor} ${borderColor} border rounded-2xl shadow-xl p-8 max-w-sm w-full`}
        initial={{ scale: 0.9, y: -20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: -20 }}
      >
        <div className="flex items-start gap-4">
          <Icon className={`${textColor} flex-shrink-0 mt-1`} size={24} />
          <div className="flex-1">
            <h3 className={`${titleColor} text-lg font-semibold mb-1`}>
              {title}
            </h3>
            <p className={`${textColor} text-sm`}>{message}</p>
          </div>
          <button
            aria-label="Close"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 flex-shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className={`${buttonColor} text-white px-6 py-2 rounded-lg transition font-medium`}
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ResponseModal;

