'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';

interface BackButtonProps {
  fallbackUrl?: string;
}

export default function BackButton({ fallbackUrl = '/' }: BackButtonProps) {
  const router = useRouter();

  function handleBack() {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackUrl);
    }
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      className="w-10 h-10 rounded-2xl flex items-center justify-center backdrop-blur-md transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
      style={{
        background: 'rgba(15, 23, 42, 0.75)',
        border: '1px solid rgba(241, 245, 249, 0.15)',
        color: 'var(--text-primary)',
      }}
      aria-label="الرجوع للخلف"
    >
      <ArrowRight size={20} />
    </button>
  );
}
