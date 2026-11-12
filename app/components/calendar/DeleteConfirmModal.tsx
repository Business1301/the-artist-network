"use client";

import { ArtistCalendarEvent } from "@/lib/calendar/types";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  event: ArtistCalendarEvent | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteConfirmModal({
  isOpen,
  event,
  isDeleting,
  onClose,
  onConfirm,
}: DeleteConfirmModalProps) {
  if (!isOpen || !event) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-sm rounded-2xl border border-gray-200 shadow-2xl p-6 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-xl mb-4 border border-rose-100">
          🗑️
        </div>

        <h3 className="text-base font-extrabold text-gray-900 mb-1.5">
          Delete Calendar Event?
        </h3>
        <p className="text-xs text-gray-600 leading-relaxed mb-5">
          Are you sure you want to delete <strong className="text-gray-900">&ldquo;{event.title}&rdquo;</strong>? This action cannot be undone and will permanently remove this entry from your calendar.
        </p>

        <div className="flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl text-xs font-bold text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Deleting...
              </>
            ) : (
              "Yes, Delete"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

