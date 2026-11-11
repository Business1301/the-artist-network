"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  ArtistApplication,
  approveArtistApplication,
  rejectArtistApplication,
  verifyArtistApplication,
  unverifyArtistApplication,
  getApplicationDetails,
} from "@/app/actions/admin";

interface ApplicationsManagerProps {
  initialApplications: ArtistApplication[];
  initialSelectedId?: string;
}

export default function ApplicationsManager({
  initialApplications,
  initialSelectedId,
}: ApplicationsManagerProps) {
  const [applications, setApplications] = useState<ArtistApplication[]>(initialApplications);
  const [filter, setFilter] = useState<"pending_review" | "published" | "rejected" | "all">("pending_review");
  const [selectedApp, setSelectedApp] = useState<ArtistApplication | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Moderation state
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionNotice, setActionNotice] = useState<{ message: string; error?: boolean } | null>(null);

  // Filter applications list
  const filteredApps = applications.filter((app) => {
    if (filter === "all") return true;
    return app.profile_status === filter;
  });

  const handleOpenReview = async (app: ArtistApplication) => {
    setSelectedApp(app);
    setIsLoadingDetails(true);
    setActionNotice(null);
    setShowRejectModal(false);
    setRejectionReason("");

    try {
      const detailed = await getApplicationDetails(app.id);
      setSelectedApp(detailed);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load detailed profile";
      setActionNotice({ message, error: true });
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Auto-open review drawer when navigating with ?review=<id>
  useEffect(() => {
    if (!initialSelectedId) return;
    let cancelled = false;
    getApplicationDetails(initialSelectedId)
      .then((detailed) => {
        if (!cancelled && detailed) {
          setSelectedApp(detailed);
        }
      })
      .catch((err) => {
        console.error("Failed to load details on mount:", err);
      });
    return () => {
      cancelled = true;
    };
  }, [initialSelectedId]);

  const handleApprove = async () => {
    if (!selectedApp) return;
    setIsProcessing(true);
    setActionNotice(null);

    const res = await approveArtistApplication(selectedApp.id);
    setIsProcessing(false);

    if (res.success) {
      setActionNotice({ message: res.message });
      // Update local state
      setApplications((prev) =>
        prev.map((a) => (a.id === selectedApp.id ? { ...a, profile_status: "published" } : a))
      );
      setSelectedApp((prev) => (prev ? { ...prev, profile_status: "published" } : null));
    } else {
      setActionNotice({ message: res.message, error: true });
    }
  };

  const handleReject = async () => {
    if (!selectedApp) return;
    if (!rejectionReason.trim() || rejectionReason.trim().length < 5) {
      setActionNotice({
        message: "Please provide a specific rejection reason of at least 5 characters.",
        error: true,
      });
      return;
    }

    setIsProcessing(true);
    setActionNotice(null);

    const res = await rejectArtistApplication(selectedApp.id, rejectionReason.trim());
    setIsProcessing(false);

    if (res.success) {
      setActionNotice({ message: res.message });
      setShowRejectModal(false);
      setApplications((prev) =>
        prev.map((a) =>
          a.id === selectedApp.id
            ? { ...a, profile_status: "rejected", rejection_reason: rejectionReason.trim(), is_verified: false }
            : a
        )
      );
      setSelectedApp((prev) =>
        prev
          ? { ...prev, profile_status: "rejected", rejection_reason: rejectionReason.trim(), is_verified: false }
          : null
      );
    } else {
      setActionNotice({ message: res.message, error: true });
    }
  };

  const handleVerify = async () => {
    if (!selectedApp) return;
    setIsProcessing(true);
    setActionNotice(null);

    const res = await verifyArtistApplication(selectedApp.id);
    setIsProcessing(false);

    if (res.success) {
      setActionNotice({ message: res.message });
      setApplications((prev) =>
        prev.map((a) => (a.id === selectedApp.id ? { ...a, is_verified: true } : a))
      );
      setSelectedApp((prev) => (prev ? { ...prev, is_verified: true } : null));
    } else {
      setActionNotice({ message: res.message, error: true });
    }
  };

  const handleUnverify = async () => {
    if (!selectedApp) return;
    setIsProcessing(true);
    setActionNotice(null);

    const res = await unverifyArtistApplication(selectedApp.id);
    setIsProcessing(false);

    if (res.success) {
      setActionNotice({ message: res.message });
      setApplications((prev) =>
        prev.map((a) => (a.id === selectedApp.id ? { ...a, is_verified: false } : a))
      );
      setSelectedApp((prev) => (prev ? { ...prev, is_verified: false } : null));
    } else {
      setActionNotice({ message: res.message, error: true });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-2 bg-zinc-900 p-1 rounded-2xl border border-zinc-800">
          <button
            onClick={() => setFilter("pending_review")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filter === "pending_review"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Pending Review ({applications.filter((a) => a.profile_status === "pending_review").length})
          </button>

          <button
            onClick={() => setFilter("published")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filter === "published"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Published ({applications.filter((a) => a.profile_status === "published").length})
          </button>

          <button
            onClick={() => setFilter("rejected")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filter === "rejected"
                ? "bg-red-500/20 text-red-300 border border-red-500/40 shadow-xs"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Rejected ({applications.filter((a) => a.profile_status === "rejected").length})
          </button>

          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filter === "all"
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-xs"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            All ({applications.length})
          </button>
        </div>

        <div className="text-xs text-zinc-400">
          Showing <span className="font-bold text-white">{filteredApps.length}</span> application(s)
        </div>
      </div>

      {/* Applications Table / Cards */}
      {filteredApps.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-12 text-center">
          <span className="text-4xl block mb-2">📋</span>
          <h3 className="text-base font-bold text-zinc-200">No applications match this filter</h3>
          <p className="text-xs text-zinc-500 mt-1">
            {filter === "pending_review"
              ? "All submitted artist applications have been moderated."
              : `There are currently no artists with status '${filter}'.`}
          </p>
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950/60 border-b border-zinc-800 text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-3.5">Artist</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Location</th>
                  <th className="px-4 py-3.5">Pricing</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Submitted</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-200">
                {filteredApps.map((app) => {
                  const statusBadge =
                    app.profile_status === "published"
                      ? "bg-emerald-950/80 text-emerald-400 border-emerald-800"
                      : app.profile_status === "rejected"
                      ? "bg-red-950/80 text-red-400 border-red-800"
                      : "bg-amber-950/80 text-amber-400 border-amber-800";

                  return (
                    <tr key={app.id} className="hover:bg-zinc-800/40 transition-colors">
                      <td className="px-6 py-4 font-medium">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-purple-950/60 border border-purple-800/60 flex items-center justify-center text-sm font-bold text-purple-300">
                            {app.stage_name[0] || "?"}
                          </div>
                          <div>
                            <div className="font-bold text-sm text-white flex items-center gap-1.5">
                              <span>{app.stage_name}</span>
                              {app.is_verified && (
                                <span className="text-purple-400 text-xs font-bold" title="Verified Artist">
                                  ✓
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-zinc-400 truncate max-w-[140px]">
                              @{app.slug}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <span className="px-2.5 py-1 rounded-md bg-zinc-800 text-zinc-300 text-[11px] font-medium capitalize">
                          {app.category}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-zinc-300">
                        📍 {app.city}{app.state ? `, ${app.state}` : ""}
                      </td>

                      <td className="px-4 py-4 text-zinc-300">
                        {app.starting_price ? (
                          <span>
                            ₹{Number(app.starting_price).toLocaleString("en-IN")}{" "}
                            <span className="text-[10px] text-zinc-500">/{app.pricing_unit || "event"}</span>
                          </span>
                        ) : (
                          <span className="text-zinc-500">Not set</span>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${statusBadge}`}>
                          {app.profile_status.replace("_", " ")}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-zinc-400 text-[11px]">
                        {new Date(app.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleOpenReview(app)}
                          className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition-colors shadow-xs"
                        >
                          Review &rarr;
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-950/60 border border-purple-800/60 flex items-center justify-center text-base font-bold text-purple-300">
                  {selectedApp.stage_name[0] || "?"}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <span>{selectedApp.stage_name}</span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-zinc-800 text-zinc-300">
                      {selectedApp.category}
                    </span>
                    {selectedApp.is_verified && (
                      <span className="text-purple-400 text-xs font-bold">✓ Verified</span>
                    )}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    ID: <code className="text-zinc-300">{selectedApp.id}</code> &bull; Submitted{" "}
                    {new Date(selectedApp.created_at).toLocaleDateString("en-IN")}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedApp(null)}
                className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center text-sm font-bold transition-colors"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs text-zinc-300">
              {/* Notice */}
              {actionNotice && (
                <div
                  className={`p-3.5 rounded-2xl text-xs border leading-relaxed ${
                    actionNotice.error
                      ? "bg-red-950/60 border-red-800 text-red-300"
                      : "bg-emerald-950/60 border-emerald-800 text-emerald-300"
                  }`}
                >
                  {actionNotice.message}
                </div>
              )}

              {/* Status Banner */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase tracking-wider font-semibold">
                    Current Moderation Status
                  </span>
                  <span className="font-bold text-sm text-white capitalize">
                    {selectedApp.profile_status.replace("_", " ")}
                  </span>
                </div>
                {selectedApp.rejection_reason && (
                  <div className="text-right max-w-sm">
                    <span className="text-red-400 block text-[10px] uppercase tracking-wider font-semibold">
                      Reason
                    </span>
                    <span className="text-zinc-300 text-xs italic">
                      &quot;{selectedApp.rejection_reason}&quot;
                    </span>
                  </div>
                )}
              </div>

              {/* Basic Details */}
              <div>
                <h4 className="font-bold text-sm text-white mb-2">Profile Overview</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-zinc-950/40 border border-zinc-800/80">
                  <div>
                    <span className="text-zinc-500 block text-[10px] font-semibold uppercase">Location</span>
                    <span className="text-zinc-200 font-medium">📍 {selectedApp.city}{selectedApp.state ? `, ${selectedApp.state}` : ""}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px] font-semibold uppercase">Experience</span>
                    <span className="text-zinc-200 font-medium">{selectedApp.experience_years} years</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px] font-semibold uppercase">Starting Fee</span>
                    <span className="text-zinc-200 font-medium">
                      {selectedApp.starting_price
                        ? `₹${Number(selectedApp.starting_price).toLocaleString("en-IN")} / ${selectedApp.pricing_unit || "event"}`
                        : "Not specified"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div>
                <h4 className="font-bold text-sm text-white mb-1.5">Biography</h4>
                <div className="p-4 rounded-2xl bg-zinc-950/40 border border-zinc-800/80 leading-relaxed text-zinc-300 whitespace-pre-wrap">
                  {selectedApp.bio || <span className="text-zinc-500 italic">No biography provided.</span>}
                </div>
              </div>

              {/* Genres / Specialities */}
              {selectedApp.genres && selectedApp.genres.length > 0 && (
                <div>
                  <h4 className="font-bold text-sm text-white mb-1.5">Genres & Styles</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedApp.genres.map((g) => (
                      <span key={g} className="px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300 text-[11px] font-medium">
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Portfolio Items */}
              <div>
                <h4 className="font-bold text-sm text-white mb-2">
                  Portfolio Items ({selectedApp.portfolio_items?.length || 0})
                </h4>
                {isLoadingDetails ? (
                  <div className="p-6 text-center text-zinc-500">Loading portfolio media...</div>
                ) : !selectedApp.portfolio_items || selectedApp.portfolio_items.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-zinc-950/40 border border-zinc-800/80 text-zinc-500 italic">
                    No portfolio media items uploaded yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedApp.portfolio_items.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 flex items-start gap-3"
                      >
                        {item.thumbnail_url || (item.media_type === "image" && item.media_url) ? (
                          <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-zinc-800">
                            <Image
                              src={item.thumbnail_url || item.media_url}
                              alt={item.title}
                              fill
                              sizes="64px"
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-zinc-800 shrink-0 flex items-center justify-center text-lg">
                            {item.media_type === "youtube" ? "🎬" : item.media_type === "audio" ? "🎵" : "📎"}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <span className="font-bold text-zinc-200 block truncate">{item.title}</span>
                          <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">
                            {item.media_type}
                          </span>
                          <a
                            href={item.media_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-purple-400 hover:text-purple-300 truncate block mt-1 underline"
                          >
                            Open Media &rarr;
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Reject Reason Form (if toggled) */}
              {showRejectModal && (
                <div className="p-4 rounded-2xl bg-red-950/40 border border-red-800/80 space-y-3">
                  <h4 className="font-bold text-sm text-red-300">Mandatory Rejection Reason</h4>
                  <p className="text-zinc-400 text-[11px]">
                    Explain clearly to the artist what needs to be improved or completed before resubmitting.
                  </p>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g. Please provide at least two portfolio audio samples and a clearer stage photo."
                    rows={3}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-red-800/60 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-red-500"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowRejectModal(false)}
                      className="px-3 py-1.5 rounded-xl border border-zinc-700 text-xs font-semibold text-zinc-300 hover:bg-zinc-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleReject}
                      disabled={isProcessing}
                      className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs disabled:opacity-50"
                    >
                      {isProcessing ? "Rejecting..." : "Confirm Rejection"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-950/80 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {/* Verification Actions (only for published artists) */}
                {selectedApp.profile_status === "published" && (
                  <>
                    {!selectedApp.is_verified ? (
                      <button
                        onClick={handleVerify}
                        disabled={isProcessing}
                        className="px-4 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/40 text-purple-300 border border-purple-500/40 font-semibold text-xs transition-colors disabled:opacity-50"
                      >
                        {isProcessing ? "Processing..." : "✓ Grant Verification Badge"}
                      </button>
                    ) : (
                      <button
                        onClick={handleUnverify}
                        disabled={isProcessing}
                        className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 font-semibold text-xs transition-colors disabled:opacity-50"
                      >
                        {isProcessing ? "Processing..." : "Revoke Verification Badge"}
                      </button>
                    )}
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Approve & Reject buttons */}
                {selectedApp.profile_status !== "published" && (
                  <button
                    onClick={() => setShowRejectModal(true)}
                    disabled={isProcessing || showRejectModal}
                    className="px-4 py-2 rounded-xl bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800/60 font-semibold text-xs transition-colors disabled:opacity-50"
                  >
                    Reject Application
                  </button>
                )}

                {selectedApp.profile_status !== "published" && (
                  <button
                    onClick={handleApprove}
                    disabled={isProcessing}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-md shadow-emerald-950/40 disabled:opacity-50"
                  >
                    {isProcessing ? "Approving..." : "Approve & Publish"}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedApp(null)}
                  className="px-4 py-2 rounded-xl border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white font-medium text-xs transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

