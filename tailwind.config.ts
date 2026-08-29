/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // خط كايرو بتاعك (أهم حاجة للنصوص العربية)
      fontFamily: {
        cairo: ['var(--font-cairo)', 'Cairo', 'system-ui', 'sans-serif'],
      },
      colors: {
        // ألوانك الأصلية
        slate: {
          850: '#172033',
        },
        amber: {
          350: '#fcd272',
        },
        // الألوان السينمائية الصارمة للـ UI الجديد
        background: "#050505", // أسود عميق (OLED)
        surface: "rgba(18, 18, 21, 0.3)", // زجاج غامق للبطاقات
        accent: {
          DEFAULT: "#f5a623", // عنبري فخم
          glow: "rgba(245, 166, 35, 0.35)",
        },
        text: {
          primary: "#ffffff",
          secondary: "#a1a1aa",
          muted: "#71717a",
        },
        border: {
          glass: "rgba(255, 255, 255, 0.08)", // حواف زجاجية خفيفة
        }
      },
      backgroundImage: {
        // الإضاءة العلوية بتاعتك (رهيبة جداً)
        'cinematic-radial': 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(245,158,11,0.08) 0%, transparent 70%)',
      },
      animation: {
        // الأنيميشن بتاعك
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        shimmer: 'shimmer 1.6s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
        'bounce-in': 'bounceIn 0.4s cubic-bezier(0.68,-0.55,0.265,1.55)',
        // أنيميشن الواجهة الحديثة (Staggered & Fluid)
        'fade-in-up': 'fadeInUp 0.65s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        // الكي فريمز بتاعتك
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 15px rgba(245,158,11,0.25)' },
          '50%': { boxShadow: '0 0 35px rgba(245,158,11,0.5)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        // الكي فريمز للواجهة الجديدة
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
};