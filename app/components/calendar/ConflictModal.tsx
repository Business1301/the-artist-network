"use client";

import { useEffect } from "react";
import { ConflictingEvent } from "@/lib/calendar/types";
import { formatIstDate, formatIstTime } from "@/lib/calendar/utils";

interface ConflictModalProps {
  isOpen: boolean;
  conflicts: ConflictingEvent[];
  proposedTitle: string;
  isSaving: boolean;
  onClose: () => void;
  onSaveAnyway: () => void;
}

export default function ConflictModal({
  isOpen,
  conflicts,
  proposedTitle,
  isSaving,
  onClose,
  onSaveAnyway,
}: ConflictModalProps) {
  useEffect(() => {
    if (!isOpen || isSaving) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSaving, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md rounded-2xl border border-amber-200 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-amber-100 bg-amber-50/60 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-xl shrink-0">
            ⚠️
          </div>
          <div>
            <h2 className="text-base font-extrabold text-amber-950">
              Scheduling Conflict Detected
            </h2>
            <p className="text-xs text-amber-800">
              Double-booking requires explicit artist confirmation.
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          <p className="text-gray-700 leading-relaxed">
            Your event <strong className="text-gray-950">&ldquo;{proposedTitle}&rdquo;</strong> overlaps with the following confirmed commitments on your personal calendar:
          </p>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {conflicts.map((conf) => (
              <div
                key={conf.id}
                className="p-3 rounded-xl border border-amber-200 bg-amber-50/40 text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900 truncate">
                    {conf.event_type === "unavailable_block" ? "⛔ " : "🎵 "}
                    {conf.title}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 uppercase tracking-wider shrink-0">
                    {conf.event_type === "unavailable_block" ? "Blocked" : "Confirmed"}
                  </span>
                </div>
                <div className="text-[11px] text-gray-600 flex items-center gap-1.5 flex-wrap">
                  <span>📅 {formatIstDate(conf.start_time)}</span>
                  <span>•</span>
                  <span>
                    {conf.is_all_day
                      ? "All day"
                      : `${formatIstTime(conf.start_time)} – ${formatIstTime(conf.end_time)}`}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-[11px] text-gray-600 leading-normal">
            <strong>Need intentional overlapping?</strong> If you are managing multiple sets, separate band members, or parallel sessions, you may proceed with <em>Save Anyway</em>. Otherwise, please cancel to adjust your timings.
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl text-xs font-bold text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 transition-colors cursor-pointer"
          >
            Cancel &amp; Adjust
          </button>
          <button
            type="button"
            onClick={onSaveAnyway}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              "Save Anyway (Allow Overlap)"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

