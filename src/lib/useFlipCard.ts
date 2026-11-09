// ─────────────────────────────────────────────────────────────
//  REVIA — "Director's Cut" card flip (press-and-hold / right-click)
//
//  One implementation for every card that flips. Spread `bind` on the
//  card's wrapper element and add the `press-surface` class to it.
//
//  Touch:  hold for 500 ms without moving more than a few pixels → flip.
//          Scrolling cancels it. A tap on a flipped card turns it back.
//  Mouse:  right-click toggles.
//
//  Elements inside the card that must keep working normally (an "add"
//  button, for example) opt out with the `data-no-flip` attribute.
// ─────────────────────────────────────────────────────────────
import { useCallback, useEffect, useRef, useState } from 'react';
import type { MouseEvent, PointerEvent } from 'react';
import { showToast } from '@/components/Toaster';

export const DIRECTORS_NOTES = [
  'Ozz says: The UI took 3 cups of coffee and zero sleep to build! ☕',
  'Fun Fact: Every glassmorphic card in REVIA was tested on 4K OLED screens! 🎬',
  'Director’s Cut: Secretly watching movies during development was 100% part of the job! 🍿',
  'Dev Note: The blur radius was calibrated using actual IMAX cinema optical lenses! ✨',
  'Behind The Scenes: This card was written at 3:42 AM while binge-watching Oppenheimer. ⏳',
  'Easter Egg Lore: 9 out of 10 developers recommend pairing this movie with extra butter popcorn. 🧈',
  'Audio Check: No actual actors were harmed during the deployment of this database query. 🎧',
  'Director’s Advice: Never pause a Christopher Nolan movie to explain the plot. Just ride the wave! 🌊',
  'Studio Secret: The soundtrack for building REVIA was Hans Zimmer on loop for 72 hours. 🎻',
  'Cinematographer Note: That 1px border glow is rendered with 100% organic starlight. 🌟',
  'Critic Consensus: 10/10 masterclass in frontend glassmorphism and pure cinema love! 🏆',
  'Production Trivia: Over 500 lines of Tailwind CSS were written before the opening credits rolled! 🎞️',
];

const LONG_PRESS_MS = 500;
// A resting finger always drifts a little; only a real move cancels the press.
const MOVE_TOLERANCE_PX = 10;

function optsOut(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest('[data-no-flip]') !== null;
}

export function useFlipCard() {
  const [isFlipped, setIsFlipped] = useState(false);
  const [directorsNote, setDirectorsNote] = useState('');

  // Mirrors `isFlipped` so the handlers can read it without being re-created.
  const flippedRef = useRef(false);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressStart = useRef<{ x: number; y: number } | null>(null);
  const lastPointerType = useRef('mouse');
  // Set when a long-press has just flipped the card: the click that some
  // browsers fire when the finger lifts must not count as a tap.
  const swallowClick = useRef(false);

  const cancelPress = useCallback(() => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    pressTimer.current = null;
    pressStart.current = null;
  }, []);

  // No timer may outlive the card.
  useEffect(() => cancelPress, [cancelPress]);

  // Flip and un-flip are explicit, never a toggle, so two events arriving
  // for one gesture cannot flip the card there and straight back.
  const flip = useCallback(() => {
    if (flippedRef.current) return;
    flippedRef.current = true;
    setDirectorsNote(DIRECTORS_NOTES[Math.floor(Math.random() * DIRECTORS_NOTES.length)]);
    setIsFlipped(true);
    showToast('Director’s Cut Unlocked! 🎥 3D Flip');
  }, []);

  const unflip = useCallback(() => {
    flippedRef.current = false;
    setIsFlipped(false);
  }, []);

  const onPointerDown = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      lastPointerType.current = e.pointerType;
      swallowClick.current = false;
      cancelPress();

      // Mouse users right-click instead; a flipped card just waits for a tap.
      if (e.pointerType === 'mouse' || flippedRef.current || optsOut(e.target)) return;

      pressStart.current = { x: e.clientX, y: e.clientY };
      pressTimer.current = setTimeout(() => {
        pressTimer.current = null;
        pressStart.current = null;
        swallowClick.current = true;
        // A short haptic tick where supported. Browsers refuse (and log) the
        // call until the page has been tapped at least once, so check first.
        if (navigator.userActivation?.hasBeenActive && 'vibrate' in navigator) navigator.vibrate(12);
        flip();
      }, LONG_PRESS_MS);
    },
    [cancelPress, flip]
  );

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      const start = pressStart.current;
      if (!start) return;
      if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > MOVE_TOLERANCE_PX) cancelPress();
    },
    [cancelPress]
  );

  const onContextMenu = useCallback(
    (e: MouseEvent<HTMLElement>) => {
      if (optsOut(e.target)) return;
      // Never show the browser's own menu over a card.
      e.preventDefault();
      e.stopPropagation();
      // On a touch screen this event is the browser reacting to the same
      // long-press the timer above already handles, so it is ignored here.
      if (lastPointerType.current !== 'mouse') return;
      if (flippedRef.current) unflip();
      else flip();
    },
    [flip, unflip]
  );

  const onClickCapture = useCallback(
    (e: MouseEvent<HTMLElement>) => {
      if (optsOut(e.target)) return;
      if (swallowClick.current) {
        swallowClick.current = false;
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (flippedRef.current) {
        // A tap on the back turns the card over instead of opening it.
        e.preventDefault();
        e.stopPropagation();
        unflip();
      }
    },
    [unflip]
  );

  return {
    isFlipped,
    directorsNote,
    bind: {
      onPointerDown,
      onPointerMove,
      onPointerUp: cancelPress,
      // Fired when the browser takes the touch over, e.g. to scroll the row.
      onPointerCancel: cancelPress,
      onPointerLeave: cancelPress,
      onContextMenu,
      onClickCapture,
    },
  };
}
