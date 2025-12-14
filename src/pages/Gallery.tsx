// src/pages/Gallery.tsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import { useUser } from "@clerk/clerk-react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { PlusCircle, Upload, Trash2, ImageIcon, Edit, X, Trash, AlertCircle } from "lucide-react";

import ClientNavbar from "../components/UsersNavbar";
import DynamicSidebar from "../components/Sidebar";

// === Types ===
type DesignerRecord = {
  _id: Id<"designers">;
  user_id: Id<"users">;
};

type GalleryRecord = {
  _id: Id<"galleries">;
  designer_id: Id<"designers">;
  title: string;
  caption?: string;
  created_at: number;
};

type GalleryImageRecord = {
  _id: Id<"gallery_images">;
  gallery_id: Id<"galleries">;
  image: Id<"_storage">;
  created_at: number;
};

// === Local reference type for previews before upload ===
type LocalImage = {
  id: string;
  file: File;
  preview: string;
};

const Gallery: React.FC = () => {
  const { user } = useUser();

  // === Queries ===
  const dbUser = useQuery(
    api.userQueries.getUserByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );
  const designer = useQuery(
    api.designers.getByUser,
    dbUser?._id ? { userId: dbUser._id } : "skip"
  ) as DesignerRecord | null | undefined;

  const galleries = useQuery(
    api.gallery.getByDesigner,
    designer?._id ? { designerId: designer._id } : "skip"
  ) as GalleryRecord[] | null | undefined;

  const imagesByGallery = useQuery(
    api.gallery.getImagesByDesigner,
    designer?._id ? { designerId: designer._id } : "skip"
  ) as Record<string, GalleryImageRecord[]> | null | undefined;

  const allStorageIds =
    imagesByGallery
      ? Object.values(imagesByGallery).flatMap((imgs) =>
          imgs.map((i) => i.image)
        )
      : [];

  const previewUrls = useQuery(
    api.gallery.getPreviewUrls,
    allStorageIds.length > 0 ? { storageIds: allStorageIds } : "skip"
  ) as Record<string, string> | null | undefined;

  // === Mutations / Actions ===
  const addGallery = useMutation(api.gallery.addGallery);
  const addGalleryImage = useMutation(api.gallery.addGalleryImage);
  const saveGalleryImage = useAction(api.gallery.saveGalleryImage);
  const updateGallery = useMutation(api.gallery.updateGallery);
  const deleteGallery = useMutation(api.gallery.deleteGallery);
  const deleteGalleryImage = useMutation(api.gallery.deleteGalleryImage);

  // === Local States ===
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [localImages, setLocalImages] = useState<LocalImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingGalleryId, setEditingGalleryId] = useState<Id<"galleries"> | null>(null);
  const [existingImages, setExistingImages] = useState<GalleryImageRecord[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<Record<string, string>>({});
  const [imagesToDelete, setImagesToDelete] = useState<Id<"gallery_images">[]>([]);;

  // === Handle File Selection ===
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    const newImages = files.map((file) => ({
      id: Date.now() + Math.random().toString(36).substring(2, 9),
      file,
      preview: URL.createObjectURL(file),
    }));

    setLocalImages((prev) => [...prev, ...newImages]);
  };

  const removeLocalImage = (id: string) => {
    setLocalImages((prev) => prev.filter((img) => img.id !== id));
  };

  const removeExistingImage = (imageId: Id<"gallery_images">) => {
    // Mark image for deletion (will be deleted on update)
    setImagesToDelete((prev) => [...prev, imageId]);
    // Hide from preview
    setExistingImages((prev) => prev.filter((img) => img._id !== imageId));
    setExistingImageUrls((prev) => {
      const updated = { ...prev };
      delete updated[imageId.toString()];
      return updated;
    });
  };

  // === Load Gallery for Editing ===
  const handleEditGallery = async (gallery: GalleryRecord) => {
    setTitle(gallery.title);
    setCaption(gallery.caption || "");
    setLocalImages([]);
    setEditingGalleryId(gallery._id);

    // Load existing images
    const galleryImages = imagesByGallery?.[gallery._id] || [];
    setExistingImages(galleryImages);

    // Load image URLs
    const urls: Record<string, string> = {};
    for (const img of galleryImages) {
      if (previewUrls?.[img.image.toString()]) {
        urls[img._id.toString()] = previewUrls[img.image.toString()];
      }
    }
    setExistingImageUrls(urls);

    setShowAddForm(true);
  };

  // === Save Gallery (Create or Update) ===
  const handleSaveGallery = async () => {
    if (!designer?._id) return alert("No designer profile found");
    if (!title.trim()) {
      return alert("⚠️ Title is required");
    }

    setUploading(true);

    try {
      if (editingGalleryId) {
        // Update existing gallery
        await updateGallery({
          galleryId: editingGalleryId,
          title,
          caption,
        });

        // Delete marked images
        for (const imageId of imagesToDelete) {
          try {
            await deleteGalleryImage({ imageId });
          } catch (err) {
            console.error("Failed to delete image:", err);
          }
        }

        // Upload new images if any
        if (localImages.length > 0) {
          for (const img of localImages) {
            const arrayBuffer = await img.file.arrayBuffer();
            const storageId = await saveGalleryImage({
              galleryId: editingGalleryId,
              image: arrayBuffer,
            });
            await addGalleryImage({
              gallery_id: editingGalleryId,
              image: storageId as Id<"_storage">,
            });
          }
        }

        alert("✅ Gallery updated successfully!");
        setEditingGalleryId(null);
        setImagesToDelete([]);
      } else {
        // Create new gallery
        if (localImages.length === 0) {
          return alert("⚠️ At least one image is required for new gallery");
        }

        const galleryId = await addGallery({
          designer_id: designer._id,
          title,
          caption,
        });

        // Upload images
        for (const img of localImages) {
          const arrayBuffer = await img.file.arrayBuffer();
          const storageId = await saveGalleryImage({
            galleryId,
            image: arrayBuffer,
          });
          await addGalleryImage({
            gallery_id: galleryId,
            image: storageId as Id<"_storage">,
          });
        }

        alert("✅ Gallery posted successfully!");
      }

      setTitle("");
      setCaption("");
      setLocalImages([]);
      setShowAddForm(false);
    } catch (err) {
      console.error(err);
      alert("❌ Failed to save gallery");
    } finally {
      setUploading(false);
    }
  };

  // === Delete Gallery ===
  const handleDeleteGallery = async (galleryId: Id<"galleries">) => {
    if (!confirm("Are you sure you want to delete this gallery? This action cannot be undone.")) {
      return;
    }

    try {
      await deleteGallery({ galleryId });
      alert("✅ Gallery deleted successfully!");
    } catch (err) {
      console.error(err);
      alert("❌ Failed to delete gallery");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex min-h-screen bg-gradient-to-br from-white to-teal-50"
    >
      <DynamicSidebar />
      <div className="flex-1 flex flex-col">
        <ClientNavbar />
        <main className="p-6 md:p-8 overflow-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-5xl space-y-8"
          >
            {/* === Add Gallery Button === */}
            {!showAddForm && (
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-medium transition"
              >
                <PlusCircle size={20} />
                Add New Gallery
              </button>
            )}

            {/* === Create New Gallery Form === */}
            {showAddForm && (
            <div className="p-6 bg-white rounded-2xl shadow-md space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  {editingGalleryId ? (
                    <>
                      <Edit className="text-blue-600" /> Edit Gallery
                    </>
                  ) : (
                    <>
                      <PlusCircle className="text-teal-600" /> Create New Gallery
                    </>
                  )}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingGalleryId(null);
                    setTitle("");
                    setCaption("");
                    setLocalImages([]);
                    setExistingImages([]);
                    setExistingImageUrls({});
                    setImagesToDelete([]);
                  }}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                  aria-label="Close form"
                >
                  <X size={20} />
                </button>
              </div>
              <input
                type="text"
                placeholder="Gallery Title *"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-gray-300 focus:ring-2 focus:ring-teal-400 rounded-lg px-3 py-2"
              />
              <textarea
                placeholder="Caption (optional)"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full border border-gray-300 focus:ring-2 focus:ring-teal-400 rounded-lg px-3 py-2"
              />

              {/* === Existing Images (when editing) === */}
              {editingGalleryId && existingImages.length > 0 && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <AlertCircle size={16} />
                    Current Gallery Images
                  </h3>
                  <div className="grid grid-cols-4 gap-3">
                    {existingImages.map((img) => (
                      <div
                        key={img._id}
                        className="relative group aspect-square bg-white border border-blue-200 rounded-md overflow-hidden"
                      >
                        {existingImageUrls[img._id.toString()] ? (
                          <img
                            src={existingImageUrls[img._id.toString()]}
                            alt="Gallery"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100">
                            <ImageIcon className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                        <button
                          type="button"
                          aria-label="Remove image"
                          onClick={() => removeExistingImage(img._id)}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* === Upload & Preview Images === */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-700">
                    {editingGalleryId ? "Add New Images (optional)" : "Gallery Images *"}
                  </label>
                  <label
                    htmlFor="gallery-image-upload"
                    className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-teal-600 bg-teal-50 rounded-md cursor-pointer hover:bg-teal-100 transition-colors"
                  >
                    <Upload size={14} />
                    Upload Images
                  </label>
                  <input
                    id="gallery-image-upload"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>

                {localImages.length > 0 ? (
                  <div className="grid grid-cols-4 gap-3">
                    {localImages.map((img) => (
                      <div
                        key={img.id}
                        className="relative group aspect-square bg-gray-50 border border-gray-200 rounded-md overflow-hidden"
                      >
                        <img
                          src={img.preview}
                          alt="Gallery"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          aria-label="Remove image"
                          onClick={() => removeLocalImage(img.id)}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center w-full p-6 bg-gray-50 border border-gray-200 border-dashed rounded-md">
                    <ImageIcon className="w-8 h-8 mb-2 text-gray-300" />
                    <p className="text-sm text-gray-500">
                      No images uploaded yet
                    </p>
                    <p className="text-xs text-gray-400">
                      Upload multiple images for your gallery
                    </p>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleSaveGallery}
                disabled={uploading}
                className="px-6 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg"
              >
                {uploading ? "Saving..." : editingGalleryId ? "Update Gallery" : "Post Gallery"}
              </button>
            </div>
            )}

            {/* === List Galleries === */}

            {/* === List Galleries === */}
            <div className="space-y-6">
              {galleries?.map((gallery) => (
                <div
                  key={gallery._id}
                  className="p-6 bg-white rounded-2xl shadow-md space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{gallery.title}</h3>
                      {gallery.caption && (
                        <p className="text-gray-600">{gallery.caption}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditGallery(gallery)}
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition"
                        aria-label="Edit gallery"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteGallery(gallery._id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                        aria-label="Delete gallery"
                      >
                        <Trash size={18} />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-3 mt-4">
                    {imagesByGallery?.[gallery._id]?.map(
                      (img: GalleryImageRecord) => (
                        <div
                          key={img._id}
                          className="relative flex items-center justify-center w-full aspect-square bg-gray-100 rounded-lg overflow-hidden"
                        >
                          {previewUrls?.[img.image.toString()] ? (
                            <img
                              src={previewUrls[img.image.toString()]}
                              alt="Gallery"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="w-8 h-8 text-gray-400" />
                          )}
                        </div>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </main>
      </div>
    </motion.div>
  );
};

export default Gallery;
