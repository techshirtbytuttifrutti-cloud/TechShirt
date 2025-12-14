// ProgressTrackingStep.tsx
import React from "react";
import type { Id } from "../../../convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

interface Preview {
  _id: Id<"design_preview">;
  preview_image: Id<"_storage">;
  created_at?: number;
}

interface ProgressTrackingStepProps {
  designId: Id<"design">;
}

const PreviewWithComments: React.FC<{ preview: Preview; url?: string; index: number; total: number }> = ({
  preview,
  url,
  index,
  total,
}) => {
  const comments = useQuery(api.comments.listByPreview, {
    preview_id: preview._id,
  });

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "No date available";
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex flex-col border-b pb-6">
      {/* Progress Label */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-500 text-white font-bold text-sm">
            {index + 1}
          </div>
          <span className="text-xs font-semibold text-gray-600">
            Progress {index + 1} of {total}
          </span>
        </div>
        <span className="text-xs text-gray-500">
          Date Posted: {formatDate(preview.created_at)}
        </span>
      </div>

      {/* Content Container */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Preview Image */}
        <div className="flex-1">
        {url ? (
          <div className="w-full h-64 flex items-center justify-center bg-white rounded-lg border border-gray-300 overflow-hidden">
            <img
              src={url}
              alt="Preview"
              className="w-full h-full object-contain"
            />
          </div>
        ) : (
          <div className="w-full h-64 flex items-center justify-center bg-gray-100 rounded-lg border border-gray-300 text-gray-400">
            No image available
          </div>
        )}
        </div>

        {/* Comments Section */}
        <div className="flex-1">
          <h3 className="font-semibold mb-2">Client Suggestions</h3>
        <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
          {comments && comments.length > 0 ? (
            comments.map((c) => (
              <div
                key={c._id}
                className="p-3 rounded-lg bg-gray-50 border shadow-sm"
              >
                <p className="text-gray-800 text-sm">{c.comment}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(c.created_at).toLocaleString()}
                </p>
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-sm">No comments to show.</p>
          )}
        </div>
        </div>
      </div>
    </div>
  );
};

const ProgressTrackingStep: React.FC<ProgressTrackingStepProps> = ({
  designId,
}) => {
  // Fetch *all previews* for this design
  const previews = useQuery(api.design_preview.listByDesign, { designId }) as
    | Preview[]
    | undefined;

  // Get all preview image URLs
  const storageIds = previews?.map((p) => p.preview_image) ?? [];
  const urls =
    useQuery(api.getPreviewUrl.getPreviewUrls, { storageIds }) ?? [];

  if (!previews || previews.length === 0) {
    return <div className="text-gray-500">No previews yet.</div>;
  }

  // Reverse previews to show from first (oldest) to last (newest)
  const sortedPreviews = [...previews].reverse();
  const sortedUrls = [...urls].reverse();

  return (
    <div className="h-[65vh] pr-2 space-y-8">
      {sortedPreviews.map((p, idx) => (
        <PreviewWithComments
          key={p._id}
          preview={p}
          url={sortedUrls[idx] ?? undefined}
          index={idx}
          total={sortedPreviews.length}
        />
      ))}
    </div>
  );
};

export default ProgressTrackingStep;
