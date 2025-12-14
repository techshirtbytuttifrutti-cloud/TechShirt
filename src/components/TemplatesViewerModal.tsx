import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { X, Loader } from "lucide-react";
import type { Id } from "../../convex/_generated/dataModel";

interface TemplatesViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  shirtType: string;
  onSelectTemplate?: (imageUrl: string) => void;
}

interface Template {
  _id: string;
  template_name: string;
  template_image: Id<"_storage">;
  shirt_type_name?: string;
}

const TemplatesViewerModal: React.FC<TemplatesViewerModalProps> = ({
  isOpen,
  onClose,
  shirtType,
  onSelectTemplate,
}) => {
  // Fetch templates for the current shirt type
  const templates = useQuery(
    api.design_templates.getDesignTemplates,
    { shirtType }
  ) as Template[] | undefined;

  // Extract storage IDs for all template images
  const storageIds = (templates?.map((t) => t.template_image) ?? []) as Id<"_storage">[];

  // Fetch actual image URLs from storage
  const storageUrls =
    useQuery(api.getPreviewUrl.getPreviewUrls, { storageIds }) ?? [];

  // Combine templates with resolved image URLs
  const templatesWithUrls = useMemo(() => {
    return templates?.map((t, idx) => ({
      ...t,
      imageUrl: storageUrls[idx] || null,
    })) ?? [];
  }, [templates, storageUrls]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[100vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-teal-50 to-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">
                Templates for {shirtType}
              </h2>
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={24} className="text-gray-600" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {!templates ? (
                <div className="flex justify-center py-12">
                  <Loader className="animate-spin h-8 w-8 text-teal-500" />
                </div>
              ) : templatesWithUrls.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {templatesWithUrls.map((template: any) => (
                    <motion.div
                      key={template._id}
                      whileHover={{ scale: 1.05 }}
                      onClick={() => {
                        if (template.imageUrl && onSelectTemplate) {
                          onSelectTemplate(template.imageUrl);
                          onClose();
                        }
                      }}
                      className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer"
                    >
                      <div className="relative w-full h-48 bg-gray-100 overflow-hidden">
                        <img
                          src={
                            template.imageUrl ||
                            "https://placehold.co/300x300?text=No+Image"
                          }
                          alt={template.template_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-3">
                        <h3 className="font-semibold text-gray-800 text-sm truncate">
                          {template.template_name}
                        </h3>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">
                    No templates available for {shirtType}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default TemplatesViewerModal;

