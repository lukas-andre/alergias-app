import type { Config } from 'tailwindcss'

/**
 * AlergiasCL - Tailwind CSS Configuration
 *
 * Design System: Tech-Care Purple Theme
 *
 * Color Palette Overview:
 * - Primary: Purple/Violet (#7C3AED - Violet 600)
 * - Accent Fresh: Green for confirmations
 * - Accent Scan: Mint/Teal for scanner details
 * - State Tokens: Success, Warning, Danger, Info
 * - Neutrals: Dark text, light backgrounds
 *
 * Typography:
 * - UI/Body: Inter or Manrope (clean, readable)
 * - Brand/Headlines: Sora or Poppins (friendly, rounded)
 */

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        // ==========================================
        // PRIMARY BRAND COLORS (Purple/Violet)
        // ==========================================

        /**
         * Primary: Core brand color - Tech-Care Purple #7C3AED
         * Usage: CTAs, links, active states, focus rings
         */
        primary: {
          DEFAULT: '#7C3AED', // Violet 600 - Tech-Care Purple
          foreground: '#FFFFFF',
          50: '#FAF5FF',
          100: '#F3E8FF',
          200: '#E9D5FF',
          300: '#D8B4FE',
          400: '#C084FC',
          500: '#A855F7',
          600: '#7C3AED', // Main brand color
          700: '#6D28D9',
          800: '#5B21B6',
          900: '#4C1D95', // Primary dark
          950: '#2E1065',
        },

        /**
         * Primary Soft: Light backgrounds for primary-colored sections
         * Usage: Highlighted cards, selected states, soft emphasis
         */
        'primary-soft': {
          DEFAULT: '#EDE9FE', // Violet 100
          foreground: '#4C1D95',
        },

        // ==========================================
        // ACCENT COLORS (Fresh & Scan)
        // ==========================================

        /**
         * Accent Fresh: Green for positive actions
         * Usage: Success messages, confirmations, "safe" indicators
         */
        'accent-fresh': {
          DEFAULT: '#22C55E', // Green 500
          foreground: '#FFFFFF',
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E', // Main accent
          600: '#16A34A',
          700: '#15803D',
          800: '#166534',
          900: '#14532D',
          950: '#052E16',
        },

        /**
         * Accent Scan: Teal/Mint for scanner-related UI
         * Usage: Scan button, scanner details, analysis highlights
         */
        'accent-scan': {
          DEFAULT: '#2DD4BF', // Teal 400
          foreground: '#FFFFFF',
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF', // Main scan accent
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E',
          800: '#115E59',
          900: '#134E4A',
          950: '#042F2E',
        },

        // ==========================================
        // STATE COLORS (Semantic Tokens)
        // ==========================================

        /**
         * Success: Green for successful operations
         * Usage: Success messages, completed steps, "safe" risk level
         */
        success: {
          DEFAULT: '#16A34A', // Green 600
          foreground: '#FFFFFF',
          light: '#BBF7D0', // Green 200
          dark: '#15803D', // Green 700
        },

        /**
         * Warning: Amber for caution states
         * Usage: Warning messages, "medium" risk level, alerts
         */
        warning: {
          DEFAULT: '#CA8A04', // Amber 600
          foreground: '#FFFFFF',
          light: '#FDE68A', // Amber 200
          dark: '#92400E', // Amber 800
        },

        /**
         * Danger: Red for error/high risk states
         * Usage: Error messages, "high" risk level, destructive actions
         */
        danger: {
          DEFAULT: '#DC2626', // Red 600
          foreground: '#FFFFFF',
          light: '#FECACA', // Red 200
          dark: '#991B1B', // Red 800
        },

        /**
         * Info: Blue for informational messages
         * Usage: Info messages, tips, neutral notifications
         */
        info: {
          DEFAULT: '#0EA5E9', // Sky 500
          foreground: '#FFFFFF',
          light: '#BAE6FD', // Sky 200
          dark: '#0369A1', // Sky 700
        },

        // ==========================================
        // NEUTRAL COLORS (Text & Backgrounds)
        // ==========================================

        /**
         * Neutrals: Slate-based neutral palette
         * Usage: Text, borders, backgrounds, disabled states
         */
        neutral: {
          50: '#F8FAFC', // Light background
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A', // Dark text
          950: '#020617',
        },

        // ==========================================
        // SHADCN/UI DEFAULT TOKENS
        // (Required for shadcn components)
        // ==========================================

        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',

        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },

      // ==========================================
      // TYPOGRAPHY
      // ==========================================

      fontFamily: {
        /**
         * Sans: UI and body text
         * Options: Inter (default) or Manrope (alternative)
         */
        sans: [
          'var(--font-inter)',
          'Inter',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],

        /**
         * Display: Headlines and brand text
         * Options: Sora (default) or Poppins (alternative)
         */
        display: [
          'var(--font-sora)',
          'Sora',
          'system-ui',
          '-apple-system',
          'sans-serif',
        ],
      },

      // ==========================================
      // SPACING & SIZING
      // ==========================================

      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },

      // ==========================================
      // ANIMATIONS
      // ==========================================

      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
