import React, { useState } from "react";
import { Upload, Trash2 } from "lucide-react";

interface ShirtSize {
  _id: string;
  size_label: string;
  type?: string;
}

interface ExistingSize {
  sizeId: string;
  quantity: number;
}

interface ImageItem {
  id: number;
  image: string;
  file: File;
}

interface SizeRow {
  sizeId: string;
  quantity: number;
}

interface AddOnsModalProps {
  onClose: () => void;
  shirtSizes: ShirtSize[];
  existingSizes?: ExistingSize[];
  currentShirtTypeId?: string;
  currentDesignStatus?: string;
  onSubmit: (payload: {
    addOnType: "design" | "quantity" | "both" | "";
    images: ImageItem[];
    sizeUpdates: SizeRow[];
    reason: string;
    newStatus?: string;
  }) => void;
}

export default function AddOnsModal({
  onClose,
  shirtSizes,
  existingSizes,
  currentShirtTypeId,
  onSubmit,
}: AddOnsModalProps) {
  const [selectedType, setSelectedType] = useState<"design" | "quantity" | "both" | "">("");
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [reason, setReason] = useState("");

  const filteredShirtSizes = React.useMemo(() => {
    if (!currentShirtTypeId) return shirtSizes;
    return shirtSizes.filter((s) => s.type === currentShirtTypeId);
  }, [shirtSizes, currentShirtTypeId]);

  const [sizeRows, setSizeRows] = useState<SizeRow[]>(
    existingSizes?.map((s) => ({ sizeId: s.sizeId, quantity: s.quantity })) || []
  );

  const addSizeRow = () => setSizeRows([...sizeRows, { sizeId: "", quantity: 1 }]);
  const updateSizeRow = <K extends keyof SizeRow>(index: number, key: K, value: SizeRow[K]) => {
    const updated = [...sizeRows];
    updated[index][key] = value;
    setSizeRows(updated);
  };
  const removeSizeRow = (index: number) => setSizeRows(sizeRows.filter((_, i) => i !== index));

  // --- Fixed image compression: preserves PNG transparency ---
  const compressImageFile = (file: File, maxWidth = 800, maxHeight = 800, quality = 0.7): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          let { width, height } = img;

          if (width > height && width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          } else if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d")!;
          
          // Clear canvas to preserve transparency
          ctx.clearRect(0, 0, width, height);

          // Draw image
          ctx.drawImage(img, 0, 0, width, height);

          // Determine output format
          const ext = file.type === "image/png" ? "image/png" : "image/jpeg";
          const dataUrl = canvas.toDataURL(ext, quality);
          resolve(dataUrl);
        };
      };
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    const newImages: ImageItem[] = [];

    for (const file of files) {
      const compressed = await compressImageFile(file);
      newImages.push({
        id: Date.now() + Math.random(),
        image: compressed,
        file,
      });
    }

    setImages((prev) => [...prev, ...newImages]);
    setIsUploading(false);
  };

  const handleSubmit = () => {
    if (!selectedType) return;
    onSubmit({ addOnType: selectedType, images, sizeUpdates: sizeRows, reason });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="
    bg-white
    w-[92%]
    sm:w-[90%]
    md:w-full
    max-w-sm
    sm:max-w-md
    md:max-w-lg
    rounded-lg
    shadow-xl
    p-4 sm:p-6
    space-y-6
    max-h-[80vh]
    overflow-y-auto
    animate-fadeIn">
        <h2 className="text-xl font-semibold text-gray-800">Add-Ons</h2>

        {/* Add-on Type Selector */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Select Add-On Type</label>
          <select
            aria-label="Select add-on type"
            className="w-full p-3 border border-gray-300 rounded-md text-gray-700"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as any)}
          >
            <option value="">Pick an option</option>
            <option value="design">Design Add-Ons</option>
            <option value="quantity">Quantity Add-Ons</option>
            <option value="both">Both</option>
          </select>
        </div>

        {/* DESIGN ADD-ONS */}
        {(selectedType === "design" || selectedType === "both") && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-gray-700">Upload Reference Images</label>
              <label
                htmlFor="add-on-img"
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-teal-600 bg-teal-50 rounded-md cursor-pointer hover:bg-teal-100"
              >
                <Upload size={14} /> Upload
              </label>
              <input
                id="add-on-img"
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            {isUploading && <p className="text-sm text-gray-500">Uploading...</p>}

            {images.length > 0 && (
              <div className="space-y-3">
                {images.map((img) => (
                  <div key={img.id} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-md">
                    <img alt="Preview" src={img.image} className="w-20 h-20 object-contain rounded-md border" />
                    <div className="flex-1"></div>
                    <button
                      aria-label="Remove image"
                      className="p-1 text-red-500 hover:bg-red-50 rounded-md"
                      onClick={() => setImages((prev) => prev.filter((i) => i.id !== img.id))}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* QUANTITY ADD-ONS */}
        {(selectedType === "quantity" || selectedType === "both") && (
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700">Add / Modify Quantities</label>
            {sizeRows.map((row, idx) => (
              <div key={idx} className="grid grid-cols-3 gap-2 items-center">
                <select
                  aria-label="Select a shirt size"
                  className="p-2 border rounded-md"
                  value={row.sizeId}
                  onChange={(e) => updateSizeRow(idx, "sizeId", e.target.value)}
                >
                  <option value="">Select size</option>
                  {filteredShirtSizes.map((s) => (
                    <option key={s._id} value={s._id}>{s.size_label}</option>
                  ))}
                </select>
                <input
                  aria-label="Enter quantity"
                  type="number"
                  className="p-2 border rounded-md"
                  min={1}
                  value={row.quantity}
                  onChange={(e) => updateSizeRow(idx, "quantity", Number(e.target.value))}
                />
                <button
                  aria-label="Remove size"
                  className="p-2 rounded-md text-red-500 hover:bg-red-50"
                  onClick={() => removeSizeRow(idx)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button onClick={addSizeRow} className="px-3 py-1.5 text-sm text-teal-600 bg-teal-50 rounded-md hover:bg-teal-100">
              + Add Size
            </button>
          </div>
        )}

        {/* Reason */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Reason for Add-Ons</label>
          <textarea
            aria-label="Reason for add-ons"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain why you need these add-ons..."
            className="w-full p-3 border border-gray-300 rounded-md text-gray-700 focus:ring-2 focus:ring-teal-400 focus:border-teal-400"
            rows={4}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={!selectedType}
            className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:bg-teal-300"
          >
            Save Add-Ons
          </button>
        </div>
      </div>
    </div>
  );
}
