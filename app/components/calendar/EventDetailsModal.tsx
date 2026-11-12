"use client";

import { ArtistCalendarEvent } from "@/lib/calendar/types";
import {
  formatIstDate,
  formatIstTime,
  formatCurrencyInr,
} from "@/lib/calendar/utils";
import { getEventStyle } from "./EventBadge";

interface EventDetailsModalProps {
  event: ArtistCalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (event: ArtistCalendarEvent) => void;
  onDelete: (event: ArtistCalendarEvent) => void;
}

export default function EventDetailsModal({
  event,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}: EventDetailsModalProps) {
  if (!isOpen || !event) return null;

  const style = getEventStyle(event);
  const isPlatform = event.source === "platform_booking";
  const isBlocked = event.event_type === "unavailable_block";

  const remainingBalance =
    event.agreed_fee != null && event.deposit_paid != null
      ? Math.max(0, event.agreed_fee - event.deposit_paid)
      : null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-lg rounded-2xl border border-gray-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-100 flex items-start justify-between bg-gray-50/50">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${style.bg} ${style.border} ${style.text}`}
              >
                {style.label}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                {isPlatform ? "TAN Booking" : "External Manual Gig"}
              </span>
              <span className="text-[10px] text-gray-500 font-medium">
                IST (Asia/Kolkata)
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-gray-900 leading-snug">
              {isBlocked ? "⛔ " : ""}
              {event.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Platform Booking Warning */}
          {isPlatform && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
              <span className="text-base shrink-0">🛡️</span>
              <div>
                <p className="font-bold">Platform-Generated Booking</p>
                <p className="text-[11px] mt-0.5 opacity-90">
                  This booking originated through The Artist Network inquiry
                  workflow. It is synchronized with the client and cannot be
                  manually altered or deleted from your personal calendar.
                </p>
              </div>
            </div>
          )}

          {/* Time & Scheduling */}
          <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-4 space-y-2">
            <h3 className="text-xs font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
              <span>🕒</span> Date &amp; Time (IST)
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-gray-500 block text-[11px]">Starts</span>
                <span className="font-bold text-gray-900 block">
                  {formatIstDate(event.start_time)}
                </span>
                {!event.is_all_day && (
                  <span className="text-purple-700 font-semibold text-[11px]">
                    {formatIstTime(event.start_time)}
                  </span>
                )}
              </div>
              <div>
                <span className="text-gray-500 block text-[11px]">Ends</span>
                <span className="font-bold text-gray-900 block">
                  {formatIstDate(event.end_time)}
                </span>
                {!event.is_all_day && (
                  <span className="text-purple-700 font-semibold text-[11px]">
                    {formatIstTime(event.end_time)}
                  </span>
                )}
              </div>
            </div>
            {event.is_all_day && (
              <span className="inline-block text-[11px] font-semibold text-purple-700 bg-purple-100/60 px-2 py-0.5 rounded-md mt-1">
                All-Day Event
              </span>
            )}
          </div>

          {/* Venue & Location */}
          {(event.city || event.venue_name || event.venue_address) && (
            <div className="border border-gray-200 rounded-xl p-4 space-y-1.5">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                <span>📍</span> Venue &amp; Location
              </h3>
              {event.venue_name && (
                <p className="text-xs font-bold text-gray-900">
                  {event.venue_name}
                </p>
              )}
              {event.city && (
                <p className="text-xs text-purple-700 font-medium">{event.city}</p>
              )}
              {event.venue_address && (
                <p className="text-xs text-gray-500">{event.venue_address}</p>
              )}
            </div>
          )}

          {/* Private Financial Information (Strictly Owner-Only) */}
          {(event.agreed_fee != null || event.deposit_paid != null) && (
            <div className="border border-emerald-200 bg-emerald-50/40 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                  <span>💰</span> Private Financials
                </h3>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                  Private to You
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                <div>
                  <span className="text-gray-500 block text-[11px]">Agreed Fee</span>
                  <span className="font-extrabold text-gray-900 text-sm">
                    {formatCurrencyInr(event.agreed_fee)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[11px]">Deposit</span>
                  <span className="font-semibold text-emerald-800 text-sm">
                    {formatCurrencyInr(event.deposit_paid)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[11px]">Balance</span>
                  <span className="font-bold text-gray-900 text-sm">
                    {formatCurrencyInr(remainingBalance)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Private Client Contact Info */}
          {(event.client_name || event.client_phone || event.client_email) && (
            <div className="border border-blue-200 bg-blue-50/30 rounded-xl p-4 space-y-1.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
                  <span>👤</span> Private Client Contact
                </h3>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-full">
                  Confidential
                </span>
              </div>
              <div className="text-xs space-y-1 pt-1">
                {event.client_name && (
                  <p className="font-bold text-gray-900">{event.client_name}</p>
                )}
                {event.client_phone && (
                  <p className="text-gray-700">📞 {event.client_phone}</p>
                )}
                {event.client_email && (
                  <p className="text-gray-700">✉️ {event.client_email}</p>
                )}
              </div>
            </div>
          )}

          {/* Private Notes */}
          {event.private_notes && (
            <div className="border border-gray-200 rounded-xl p-4 space-y-1">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                <span>📝</span> Private Notes
              </h3>
              <p className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">
                {event.private_notes}
              </p>
            </div>
          )}

          <div className="text-[10px] text-gray-400 text-center flex items-center justify-center gap-1">
            <span>🔒</span> Personal artist schedule. Never shared publicly.
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/80 flex items-center justify-between gap-3">
          {!isPlatform ? (
            <button
              onClick={() => onDelete(event)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors"
            >
              Delete Event
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            {!isPlatform && (
              <button
                onClick={() => onEdit(event)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition-colors"
              >
                Edit Event
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

