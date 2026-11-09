'use client';

// ─────────────────────────────────────────────────────────────
//  REVIA — Bottom sheet
//
//  The one modal sheet used across the app. It handles what every sheet
//  needs so the content only has to describe itself:
//    • slides in and out (mount it to open; it animates before calling
//      `onClose`, so the parent can simply unmount it there)
//    • closes on backdrop tap, Escape, or dragging the handle down
//    • locks page scroll and keeps keyboard focus inside while open,
//      then gives focus back to whatever opened it
//    • renders at the end of <body>, above the navigation dock, and
//      respects the bottom safe area
//
//  Children are a function that receives `close`, for the sheet's own
//  close button:  {(close) => <button onClick={close}>…</button>}
// ─────────────────────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent, ReactNode } from 'react';
import { createPortal } from 'react-dom';

const EXIT_MS = 260;
// Let go past this distance, or flick faster than this, and the sheet closes.
const DISMISS_DISTANCE_PX = 110;
const DISMISS_VELOCITY_PX_PER_MS = 0.55;

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface BottomSheetProps {
  /** Called once the closing animation has finished. Unmount the sheet here. */
  onClose: () => void;
  /** Accessible name of the dialog. */
  label: string;
  /** Set to false while something is in flight and the sheet must stay open. */
  dismissible?: boolean;
  children: (close: () => void) => ReactNode;
}

export default function BottomSheet({ onClose, label, dismissible = true, children }: BottomSheetProps) {
  const [entered, setEntered] = useState(false);
  const [closing, setClosing] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [dragging, setDragging] = useState(false);

  const sheetRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ startY: number; startTime: number } | null>(null);

  // Latest props for the listeners below, which are attached only once.
  const onCloseRef = useRef(onClose);
  const dismissibleRef = useRef(dismissible);
  onCloseRef.current = onClose;
  dismissibleRef.current = dismissible;

  const close = useCallback(() => {
    if (dismissibleRef.current) setClosing(true);
  }, []);

  // Slide in on the frame after mounting.
  useEffect(() => {
    const frame = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  // Slide out, then let the parent unmount.
  useEffect(() => {
    if (!closing) return;
    const timer = window.setTimeout(() => onCloseRef.current(), EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [closing]);

  // Lock page scroll, move focus in, and restore both on the way out.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    sheetRef.current?.focus({ preventScroll: true });

    return () => {
      document.body.style.overflow = previousOverflow;
      if (previousFocus && document.contains(previousFocus)) {
        previousFocus.focus({ preventScroll: true });
      }
    };
  }, []);

  // Escape closes; Tab cycles inside the sheet.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        close();
        return;
      }
      if (e.key !== 'Tab') return;

      const sheet = sheetRef.current;
      if (!sheet) return;
      const focusable = Array.from(sheet.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (!sheet.contains(active) || active === sheet) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [close]);

  // ── Drag the handle down to dismiss ──
  function onHandlePointerDown(e: PointerEvent<HTMLDivElement>) {
    if (!dismissibleRef.current || closing) return;
    drag.current = { startY: e.clientY, startTime: performance.now() };
    try {
      // Keeps the drag alive when the finger leaves the handle strip.
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Capture is a nicety; the drag still works while over the handle.
    }
    setDragging(true);
  }

  function onHandlePointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!drag.current) return;
    setDragOffset(Math.max(0, e.clientY - drag.current.startY));
  }

  function onHandlePointerEnd(e: PointerEvent<HTMLDivElement>) {
    const started = drag.current;
    if (!started) return;
    drag.current = null;
    setDragging(false);

    const distance = Math.max(0, e.clientY - started.startY);
    const elapsed = Math.max(1, performance.now() - started.startTime);
    const flicked = distance > 24 && distance / elapsed > DISMISS_VELOCITY_PX_PER_MS;

    if (e.type !== 'pointercancel' && (distance > DISMISS_DISTANCE_PX || flicked)) {
      close();
    } else {
      setDragOffset(0);
    }
  }

  if (typeof document === 'undefined') return null;

  const shown = entered && !closing;
  const transform = shown ? `translateY(${dragOffset}px)` : 'translateY(100%)';

  return createPortal(
    <div className="fixed inset-0 z-[60]">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{
          background: 'rgba(5,5,5,0.85)',
          opacity: shown ? 1 : 0,
          transition: `opacity ${EXIT_MS}ms ease`,
        }}
        onClick={close}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className="sheet-glass absolute inset-x-0 bottom-0 flex flex-col max-h-[92dvh] rounded-t-[2.5rem] outline-none"
        style={{
          transform,
          // While a finger is dragging, the sheet follows it exactly.
          transition: dragging ? 'none' : `transform ${EXIT_MS}ms cubic-bezier(0.16, 1, 0.3, 1)`,
          willChange: 'transform',
        }}
      >
        {/* Drag handle: a full-width strip, so it is easy to grab. */}
        <div
          className="flex-shrink-0 pt-3.5 pb-5 cursor-grab active:cursor-grabbing"
          style={{ touchAction: 'none' }}
          onPointerDown={onHandlePointerDown}
          onPointerMove={onHandlePointerMove}
          onPointerUp={onHandlePointerEnd}
          onPointerCancel={onHandlePointerEnd}
        >
          <div className="w-12 h-1 rounded-full mx-auto" style={{ background: 'var(--border-luminous)' }} />
        </div>

        {/* Content: scrolls on its own when it is taller than the sheet. */}
        <div
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 space-y-6"
          style={{ paddingBottom: 'calc(2rem + var(--safe-area-bottom))' }}
        >
          {children(close)}
        </div>
      </div>
    </div>,
    document.body
  );
}
