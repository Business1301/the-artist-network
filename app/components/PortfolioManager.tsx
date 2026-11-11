"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  PortfolioItemData,
  addPortfolioItem,
  deletePortfolioItem,
  reorderPortfolioItems,
} from "@/app/actions/artist";

interface PortfolioManagerProps {
  userId: string;
  items: PortfolioItemData[];
  onItemsChange: (items: PortfolioItemData[]) => void;
}

export default function PortfolioManager({
  userId,
  items,
  onItemsChange,
}: PortfolioManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [isAdding, setIsAdding] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // New Item Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "youtube" | "audio" | "link">("image");
  const [mediaUrl, setMediaUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Helper: Extract YouTube Embed URL
  const getYouTubeEmbedUrl = (url: string) => {
    try {
      const parsed = new URL(url);
      if (parsed.hostname.includes("youtu.be")) {
        return `https://www.youtube.com/embed/${parsed.pathname.slice(1)}`;
      }
      const v = parsed.searchParams.get("v");
      if (v) {
        return `https://www.youtube.com/embed/${v}`;
      }
      return url;
    } catch {
      return url;
    }
  };

  // Upload image to Supabase Storage
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    if (file.size > 5 * 1024 * 1024) {
      setStatusMessage({
        type: "error",
        text: "File size exceeds 5MB limit.",
      });
      return;
    }

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setStatusMessage({
        type: "error",
        text: "Please upload a JPG, PNG, or WebP image.",
      });
      return;
    }

    setIsUploading(true);
    setStatusMessage(null);

    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop();
      const filePath = `${userId}/portfolio-${Date.now()}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("artist-media")
        .upload(filePath, file, { upsert: true });

      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage
        .from("artist-media")
        .getPublicUrl(filePath);

      setMediaUrl(urlData.publicUrl);
      setStatusMessage({
        type: "success",
        text: "Image uploaded! Add a title and click Save Item.",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed.";
      setStatusMessage({
        type: "error",
        text: `Upload failed: ${msg}. You can also paste a direct image URL.`,
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Submit New Item
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !mediaUrl.trim()) {
      setStatusMessage({ type: "error", text: "Title and media URL are required." });
      return;
    }

    startTransition(async () => {
      let finalUrl = mediaUrl.trim();
      const thumbUrl: string | undefined = undefined;

      if (mediaType === "youtube") {
        finalUrl = getYouTubeEmbedUrl(finalUrl);
      }

      const res = await addPortfolioItem({
        title,
        description,
        media_type: mediaType,
        media_url: finalUrl,
        thumbnail_url: thumbUrl,
      });

      if (!res.success || !res.item) {
        setStatusMessage({ type: "error", text: res.message || "Failed to add item." });
      } else {
        onItemsChange([...items, res.item]);
        setStatusMessage({ type: "success", text: "Portfolio item added!" });
        setTitle("");
        setDescription("");
        setMediaUrl("");
        setIsAdding(false);
      }
    });
  };

  // Delete Item
  const handleDeleteItem = (id: string) => {
    if (!confirm("Are you sure you want to remove this portfolio item?")) return;

    startTransition(async () => {
      const res = await deletePortfolioItem(id);
      if (res.success) {
        onItemsChange(items.filter((item) => item.id !== id));
        setStatusMessage({ type: "success", text: "Portfolio item removed." });
      } else {
        setStatusMessage({ type: "error", text: res.message || "Failed to delete item." });
      }
    });
  };

  // Reorder Item (move up / down)
  const handleMove = (index: number, direction: "up" | "down") => {
    const newItems = [...items];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;

    const [moved] = newItems.splice(index, 1);
    newItems.splice(targetIndex, 0, moved);

    onItemsChange(newItems);

    startTransition(async () => {
      await reorderPortfolioItems(newItems.map((i) => i.id));
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
            <span>🎨</span> Portfolio &amp; Media Showcase
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Add high-resolution performance photos and embedded YouTube videos to showcase your live acts.
          </p>
        </div>

        {!isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm transition-colors self-start sm:self-auto"
          >
            + Add Media Item
          </button>
        )}
      </div>

      {/* Status banner */}
      {statusMessage && (
        <div
          className={`mb-4 p-3 rounded-xl text-xs flex items-center justify-between ${
            statusMessage.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-rose-50 border border-rose-200 text-rose-800"
          }`}
        >
          <span>{statusMessage.text}</span>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-gray-400 hover:text-gray-700 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Add New Item Form */}
      {isAdding && (
        <div className="mb-8 p-5 rounded-2xl bg-gray-50 border border-purple-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-purple-700 uppercase tracking-wider">
              New Portfolio Item
            </h3>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-xs text-gray-500 hover:text-gray-800 font-semibold"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleAddItem} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Media Type */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Media Type
                </label>
                <select
                  value={mediaType}
                  onChange={(e) =>
                    setMediaType(
                      e.target.value as "image" | "youtube" | "audio" | "link"
                    )
                  }
                  className="w-full px-3 py-2 rounded-xl bg-white border border-gray-300 text-xs text-gray-900 focus:border-purple-600 focus:outline-none"
                >
                  <option value="image">📸 Performance Photograph</option>
                  <option value="youtube">🎥 YouTube Video Embed</option>
                  <option value="audio">🎵 Audio Track (SoundCloud/Spotify/MP3)</option>
                  <option value="link">🔗 External Portfolio Link</option>
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Item Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Live Performance at Sangeet Gala"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-white border border-gray-300 text-xs text-gray-900 placeholder-gray-400 focus:border-purple-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Short Description (Optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Acoustic medley performed for 500+ guests in Udaipur"
                className="w-full px-3 py-2 rounded-xl bg-white border border-gray-300 text-xs text-gray-900 placeholder-gray-400 focus:border-purple-600 focus:outline-none"
              />
            </div>

            {/* Media URL / Upload Input */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {mediaType === "image"
                  ? "Image Upload or URL"
                  : mediaType === "youtube"
                  ? "YouTube URL (e.g. https://www.youtube.com/watch?v=...)"
                  : "Audio / Link URL"}
              </label>

              {mediaType === "image" ? (
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                  <label className="px-3 py-2 rounded-xl bg-white hover:bg-gray-100 border border-gray-300 text-xs font-semibold text-gray-700 cursor-pointer transition-colors shadow-2xs">
                    {isUploading ? "Uploading..." : "📁 Upload Photo (Max 5MB)"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={isUploading}
                    />
                  </label>
                  <span className="text-xs text-gray-400">or</span>
                  <input
                    type="url"
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    placeholder="Paste direct image URL"
                    className="flex-1 w-full px-3 py-2 rounded-xl bg-white border border-gray-300 text-xs text-gray-900 placeholder-gray-400 focus:border-purple-600 focus:outline-none"
                  />
                </div>
              ) : (
                <input
                  type="url"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder={
                    mediaType === "youtube"
                      ? "https://www.youtube.com/watch?v=..."
                      : "https://soundcloud.com/..."
                  }
                  required
                  className="w-full px-3 py-2 rounded-xl bg-white border border-gray-300 text-xs text-gray-900 placeholder-gray-400 focus:border-purple-600 focus:outline-none"
                />
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-100 text-xs font-semibold text-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending || isUploading}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all disabled:opacity-50 shadow-sm"
              >
                {isPending ? "Adding..." : "Save Media Item"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Portfolio Items Grid */}
      {items.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
          <span className="text-3xl block mb-2">📸</span>
          <p className="text-xs font-bold text-gray-700">No portfolio items added yet.</p>
          <p className="text-[11px] text-gray-500 mt-1 max-w-sm mx-auto">
            Adding 2-3 stage photos and a live YouTube clip drastically increases client bookings.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs hover:border-purple-300 transition-all flex flex-col justify-between group"
            >
              {/* Media Preview */}
              <div className="aspect-video bg-gray-100 relative overflow-hidden">
                {item.media_type === "image" ? (
                  <img
                    src={item.media_url}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : item.media_type === "youtube" ? (
                  <iframe
                    src={item.media_url}
                    title={item.title}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs p-4 text-center">
                    <span>🎵 Audio / External Link</span>
                  </div>
                )}
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/90 text-gray-700 uppercase tracking-wider backdrop-blur-sm border border-gray-200/60 shadow-2xs">
                  {item.media_type}
                </span>
              </div>

              {/* Details & Controls */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-gray-900 mb-0.5 truncate">{item.title}</h4>
                  {item.description && (
                    <p className="text-[11px] text-gray-500 line-clamp-2">{item.description}</p>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-3">
                  {/* Reordering */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMove(index, "up")}
                      className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 disabled:opacity-20 text-xs"
                      title="Move Up"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      disabled={index === items.length - 1}
                      onClick={() => handleMove(index, "down")}
                      className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 disabled:opacity-20 text-xs"
                      title="Move Down"
                    >
                      ▼
                    </button>
                  </div>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(item.id)}
                    className="text-xs text-rose-600 hover:text-rose-700 font-semibold"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
