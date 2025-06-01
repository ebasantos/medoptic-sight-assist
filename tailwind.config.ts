
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: '#1e40af',
					foreground: '#ffffff'
				},
				secondary: {
					DEFAULT: '#6b7280',
					foreground: '#ffffff'
				},
				success: {
					DEFAULT: '#059669',
					foreground: '#ffffff'
				},
				warning: {
					DEFAULT: '#ea580c',
					foreground: '#ffffff'
				},
				destructive: {
					DEFAULT: '#dc2626',
					foreground: '#ffffff'
				},
				muted: {
					DEFAULT: '#f3f4f6',
					foreground: '#6b7280'
				},
				accent: {
					DEFAULT: '#f8fafc',
					foreground: '#1e40af'
				},
				popover: {
					DEFAULT: '#ffffff',
					foreground: '#1f2937'
				},
				card: {
					DEFAULT: '#ffffff',
					foreground: '#1f2937'
				}
			},
			borderRadius: {
				lg: '12px',
				md: '8px',
				sm: '6px'
			},
			fontFamily: {
				sans: ['Inter', 'sans-serif'],
			},
			keyframes: {
				'fade-in': {
					'0%': { opacity: '0', transform: 'translateY(10px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'slide-in': {
					'0%': { opacity: '0', transform: 'translateX(-20px)' },
					'100%': { opacity: '1', transform: 'translateX(0)' }
				},
				'scale-in': {
					'0%': { opacity: '0', transform: 'scale(0.95)' },
					'100%': { opacity: '1', transform: 'scale(1)' }
				}
			},
			animation: {
				'fade-in': 'fade-in 0.3s ease-out',
				'slide-in': 'slide-in 0.4s ease-out',
				'scale-in': 'scale-in 0.2s ease-out'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
