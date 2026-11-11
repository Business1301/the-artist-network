"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  ArtistApplication,
  approveArtistApplication,
  rejectArtistApplication,
  suspendArtistProfile,
  reinstateArtistProfile,
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
  const [filter, setFilter] = useState<"published" | "suspended" | "pending_review" | "draft" | "all">("published");
  const [selectedApp, setSelectedApp] = useState<ArtistApplication | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Moderation state
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState("");
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
    setShowSuspendModal(false);
    setSuspensionReason("");

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

  const handleSuspend = async () => {
    if (!selectedApp) return;
    if (!suspensionReason.trim() || suspensionReason.trim().length < 5) {
      setActionNotice({
        message: "Please provide a specific suspension reason of at least 5 characters.",
        error: true,
      });
      return;
    }

    setIsProcessing(true);
    setActionNotice(null);

    const res = await suspendArtistProfile(selectedApp.id, suspensionReason.trim());
    setIsProcessing(false);

    if (res.success) {
      setActionNotice({ message: res.message });
      setShowSuspendModal(false);
      setApplications((prev) =>
        prev.map((a) =>
          a.id === selectedApp.id
            ? { ...a, profile_status: "suspended", rejection_reason: suspensionReason.trim(), is_verified: false }
            : a
        )
      );
      setSelectedApp((prev) =>
        prev
          ? { ...prev, profile_status: "suspended", rejection_reason: suspensionReason.trim(), is_verified: false }
          : null
      );
    } else {
      setActionNotice({ message: res.message, error: true });
    }
  };

  const handleReinstate = async () => {
    if (!selectedApp) return;
    setIsProcessing(true);
    setActionNotice(null);

    const res = await reinstateArtistProfile(selectedApp.id);
    setIsProcessing(false);

    if (res.success) {
      setActionNotice({ message: res.message });
      setApplications((prev) =>
        prev.map((a) =>
          a.id === selectedApp.id
            ? { ...a, profile_status: "published", rejection_reason: null }
            : a
        )
      );
      setSelectedApp((prev) =>
        prev ? { ...prev, profile_status: "published", rejection_reason: null } : null
      );
    } else {
      setActionNotice({ message: res.message, error: true });
    }
  };

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
    if (!suspensionReason.trim() || suspensionReason.trim().length < 5) {
      setActionNotice({
        message: "Please provide a specific rejection reason of at least 5 characters.",
        error: true,
      });
      return;
    }

    setIsProcessing(true);
    setActionNotice(null);

    const res = await rejectArtistApplication(selectedApp.id, suspensionReason.trim());
    setIsProcessing(false);

    if (res.success) {
      setActionNotice({ message: res.message });
      setShowSuspendModal(false);
      setApplications((prev) =>
        prev.map((a) =>
          a.id === selectedApp.id
            ? { ...a, profile_status: "rejected", rejection_reason: suspensionReason.trim(), is_verified: false }
            : a
        )
      );
      setSelectedApp((prev) =>
        prev
          ? { ...prev, profile_status: "rejected", rejection_reason: suspensionReason.trim(), is_verified: false }
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
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-2xl border border-gray-200">
          <button
            onClick={() => setFilter("published")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filter === "published"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs font-bold"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Published ({applications.filter((a) => a.profile_status === "published").length})
          </button>

          <button
            onClick={() => setFilter("suspended")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filter === "suspended"
                ? "bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs font-bold"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Suspended ({applications.filter((a) => a.profile_status === "suspended").length})
          </button>

          {applications.some((a) => a.profile_status === "pending_review") && (
            <button
              onClick={() => setFilter("pending_review")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                filter === "pending_review"
                  ? "bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs font-bold"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Pending Review ({applications.filter((a) => a.profile_status === "pending_review").length})
            </button>
          )}

          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filter === "all"
                ? "bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs font-bold"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            All ({applications.length})
          </button>
        </div>

        <div className="text-xs text-gray-500">
          Showing <span className="font-bold text-gray-900">{filteredApps.length}</span> artist profile(s)
        </div>
      </div>

      {/* Applications Table / Cards */}
      {filteredApps.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-sm">
          <span className="text-4xl block mb-2">📋</span>
          <h3 className="text-base font-bold text-gray-900">No applications match this filter</h3>
          <p className="text-xs text-gray-500 mt-1">
            {filter === "pending_review"
              ? "All submitted artist applications have been moderated."
              : `There are currently no artists with status '${filter}'.`}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider text-[10px]">
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
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {filteredApps.map((app) => {
                  const statusBadge =
                    app.profile_status === "published"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : app.profile_status === "suspended"
                      ? "bg-rose-50 text-rose-700 border-rose-200"
                      : app.profile_status === "rejected"
                      ? "bg-rose-50 text-rose-700 border-rose-200"
                      : app.profile_status === "draft"
                      ? "bg-gray-100 text-gray-700 border-gray-200"
                      : "bg-amber-50 text-amber-700 border-amber-200";

                  return (
                    <tr key={app.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4 font-medium">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-sm font-bold text-purple-700">
                            {app.stage_name[0] || "?"}
                          </div>
                          <div>
                            <div className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                              <span>{app.stage_name}</span>
                              {app.is_verified && (
                                <span className="text-purple-600 text-xs font-bold" title="Verified Artist">
                                  ✓
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-gray-400 truncate max-w-[140px]">
                              @{app.slug}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <span className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 text-[11px] font-medium capitalize">
                          {app.category}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-gray-600">
                        📍 {app.city}{app.state ? `, ${app.state}` : ""}
                      </td>

                      <td className="px-4 py-4 text-gray-800 font-semibold">
                        {app.starting_price ? (
                          <span>
                            ₹{Number(app.starting_price).toLocaleString("en-IN")}{" "}
                            <span className="text-[10px] text-gray-500 font-normal">/{app.pricing_unit || "event"}</span>
                          </span>
                        ) : (
                          <span className="text-gray-400 font-normal">Not set</span>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${statusBadge}`}>
                          {app.profile_status.replace("_", " ")}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-gray-500 text-[11px]">
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
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-gray-200 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between bg-gray-50/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-base font-bold text-purple-700">
                  {selectedApp.stage_name[0] || "?"}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                    <span>{selectedApp.stage_name}</span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-gray-100 text-gray-700">
                      {selectedApp.category}
                    </span>
                    {selectedApp.is_verified && (
                      <span className="text-purple-600 text-xs font-bold">✓ Verified</span>
                    )}
                  </h3>
                  <p className="text-xs text-gray-500">
                    ID: <code className="text-gray-700">{selectedApp.id}</code> &bull; Submitted{" "}
                    {new Date(selectedApp.created_at).toLocaleDateString("en-IN")}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedApp(null)}
                className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 flex items-center justify-center text-sm font-bold transition-colors"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs text-gray-700">
              {/* Notice */}
              {actionNotice && (
                <div
                  className={`p-3.5 rounded-2xl text-xs border leading-relaxed ${
                    actionNotice.error
                      ? "bg-rose-50 border-rose-200 text-rose-900"
                      : "bg-emerald-50 border-emerald-200 text-emerald-900"
                  }`}
                >
                  {actionNotice.message}
                </div>
              )}

              {/* Status Banner */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-200">
                <div>
                  <span className="text-gray-500 block text-[10px] uppercase tracking-wider font-semibold">
                    Current Moderation Status
                  </span>
                  <span className="font-bold text-sm text-gray-900 capitalize">
                    {selectedApp.profile_status.replace("_", " ")}
                  </span>
                </div>
                {selectedApp.rejection_reason && (
                  <div className="text-right max-w-sm">
                    <span className="text-rose-600 block text-[10px] uppercase tracking-wider font-semibold">
                      Reason
                    </span>
                    <span className="text-gray-700 text-xs italic">
                      &quot;{selectedApp.rejection_reason}&quot;
                    </span>
                  </div>
                )}
              </div>

              {/* Basic Details */}
              <div>
                <h4 className="font-bold text-sm text-gray-900 mb-2">Profile Overview</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-gray-50/60 border border-gray-200">
                  <div>
                    <span className="text-gray-500 block text-[10px] font-semibold uppercase">Location</span>
                    <span className="text-gray-900 font-medium">📍 {selectedApp.city}{selectedApp.state ? `, ${selectedApp.state}` : ""}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px] font-semibold uppercase">Experience</span>
                    <span className="text-gray-900 font-medium">{selectedApp.experience_years} years</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px] font-semibold uppercase">Starting Fee</span>
                    <span className="text-gray-900 font-medium">
                      {selectedApp.starting_price
                        ? `₹${Number(selectedApp.starting_price).toLocaleString("en-IN")} / ${selectedApp.pricing_unit || "event"}`
                        : "Not specified"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div>
                <h4 className="font-bold text-sm text-gray-900 mb-1.5">Biography</h4>
                <div className="p-4 rounded-2xl bg-gray-50/60 border border-gray-200 leading-relaxed text-gray-700 whitespace-pre-wrap">
                  {selectedApp.bio || <span className="text-gray-400 italic">No biography provided.</span>}
                </div>
              </div>

              {/* Genres / Specialities */}
              {selectedApp.genres && selectedApp.genres.length > 0 && (
                <div>
                  <h4 className="font-bold text-sm text-gray-900 mb-1.5">Genres & Styles</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedApp.genres.map((g) => (
                      <span key={g} className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 text-[11px] font-medium border border-gray-200">
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Portfolio Items */}
              <div>
                <h4 className="font-bold text-sm text-gray-900 mb-2">
                  Portfolio Items ({selectedApp.portfolio_items?.length || 0})
                </h4>
                {isLoadingDetails ? (
                  <div className="p-6 text-center text-gray-400">Loading portfolio media...</div>
                ) : !selectedApp.portfolio_items || selectedApp.portfolio_items.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-gray-500 italic">
                    No portfolio media items uploaded yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedApp.portfolio_items.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-2xl bg-gray-50 border border-gray-200 flex items-start gap-3"
                      >
                        {item.thumbnail_url || (item.media_type === "image" && item.media_url) ? (
                          <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-gray-100 border border-gray-200">
                            <Image
                              src={item.thumbnail_url || item.media_url}
                              alt={item.title}
                              fill
                              sizes="64px"
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-gray-100 border border-gray-200 shrink-0 flex items-center justify-center text-lg">
                            {item.media_type === "youtube" ? "🎬" : item.media_type === "audio" ? "🎵" : "📎"}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <span className="font-bold text-gray-900 block truncate">{item.title}</span>
                          <span className="text-[10px] text-gray-500 uppercase tracking-wider block">
                            {item.media_type}
                          </span>
                          <a
                            href={item.media_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-purple-600 hover:text-purple-800 truncate block mt-1 underline font-semibold"
                          >
                            Open Media &rarr;
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Suspend / Reject Reason Form (if toggled) */}
              {showSuspendModal && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-3">
                  <h4 className="font-bold text-sm text-rose-800">
                    {selectedApp.profile_status === "published"
                      ? "Mandatory Profile Suspension Reason"
                      : "Mandatory Moderation Reason"}
                  </h4>
                  <p className="text-gray-600 text-[11px]">
                    {selectedApp.profile_status === "published"
                      ? "Explain clearly why this published profile is being suspended. The profile will immediately be removed from public discovery and completely frozen."
                      : "Explain clearly to the artist why this application is not accepted."}
                  </p>
                  <textarea
                    value={suspensionReason}
                    onChange={(e) => setSuspensionReason(e.target.value)}
                    placeholder="e.g. Terms of service violation: inappropriate media uploaded or misrepresenting identity."
                    rows={3}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-rose-300 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-rose-500"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowSuspendModal(false)}
                      className="px-3 py-1.5 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={selectedApp.profile_status === "published" ? handleSuspend : handleReject}
                      disabled={isProcessing}
                      className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs disabled:opacity-50"
                    >
                      {isProcessing
                        ? "Processing..."
                        : selectedApp.profile_status === "published"
                        ? "Confirm Suspension"
                        : "Confirm Rejection"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/80 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {/* Verification Actions (only for published artists) */}
                {selectedApp.profile_status === "published" && (
                  <>
                    {!selectedApp.is_verified ? (
                      <button
                        onClick={handleVerify}
                        disabled={isProcessing}
                        className="px-4 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-semibold text-xs transition-colors disabled:opacity-50 shadow-2xs"
                      >
                        {isProcessing ? "Processing..." : "✓ Grant Verification Badge"}
                      </button>
                    ) : (
                      <button
                        onClick={handleUnverify}
                        disabled={isProcessing}
                        className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 font-semibold text-xs transition-colors disabled:opacity-50"
                      >
                        {isProcessing ? "Processing..." : "Revoke Verification Badge"}
                      </button>
                    )}
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Suspend button for published profiles */}
                {selectedApp.profile_status === "published" && (
                  <button
                    onClick={() => setShowSuspendModal(true)}
                    disabled={isProcessing || showSuspendModal}
                    className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs transition-colors disabled:opacity-50"
                  >
                    🚫 Suspend Profile
                  </button>
                )}

                {/* Reinstate button for suspended profiles */}
                {selectedApp.profile_status === "suspended" && (
                  <button
                    onClick={handleReinstate}
                    disabled={isProcessing}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors disabled:opacity-50 shadow-sm"
                  >
                    {isProcessing ? "Reinstating..." : "🔄 Reinstate Profile"}
                  </button>
                )}

                {/* Legacy Pending Review buttons */}
                {selectedApp.profile_status === "pending_review" && (
                  <>
                    <button
                      onClick={() => setShowSuspendModal(true)}
                      disabled={isProcessing || showSuspendModal}
                      className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs transition-colors disabled:opacity-50"
                    >
                      Reject
                    </button>
                    <button
                      onClick={handleApprove}
                      disabled={isProcessing}
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-sm disabled:opacity-50"
                    >
                      {isProcessing ? "Approving..." : "Approve & Publish"}
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedApp(null)}
                  className="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-100 text-gray-700 font-medium text-xs transition-colors"
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

