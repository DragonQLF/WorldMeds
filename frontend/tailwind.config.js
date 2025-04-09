module.exports = {
    content: [
      "./src/**/*.{html,js,ts,jsx,tsx}",
      "./index.html",
      "app/**/*.{ts,tsx}",
      "components/**/*.{ts,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          "colors-semantic-colors-primary-contrast":
            "var(--colors-semantic-colors-primary-contrast)",
          "colors-shades-contrast-60": "var(--colors-shades-contrast-60)",
          "primitives-color-neutral-0b090d":
            "var(--primitives-color-neutral-0b090d)",
          "primitives-color-neutral-FFFFFF":
            "var(--primitives-color-neutral-FFFFFF)",
          "system-colors-colors-blue": "var(--system-colors-colors-blue)",
          "system-colors-miscellaneous-floating-tab-text-selected":
            "var(--system-colors-miscellaneous-floating-tab-text-selected)",
          "variable-collection-blue-base": "var(--variable-collection-blue-base)",
          "variable-collection-blue-dark": "var(--variable-collection-blue-dark)",
          "variable-collection-blue-light":
            "var(--variable-collection-blue-light)",
          "variable-collection-blue-lighter":
            "var(--variable-collection-blue-lighter)",
          "variable-collection-green-base":
            "var(--variable-collection-green-base)",
          "variable-collection-green-dark":
            "var(--variable-collection-green-dark)",
          "variable-collection-green-darker":
            "var(--variable-collection-green-darker)",
          "variable-collection-green-light":
            "var(--variable-collection-green-light)",
          "variable-collection-green-lighter":
            "var(--variable-collection-green-lighter)",
          "variable-collection-neutral-0": "var(--variable-collection-neutral-0)",
          "variable-collection-neutral-100":
            "var(--variable-collection-neutral-100)",
          "variable-collection-neutral-200":
            "var(--variable-collection-neutral-200)",
          "variable-collection-neutral-300":
            "var(--variable-collection-neutral-300)",
          "variable-collection-neutral-400":
            "var(--variable-collection-neutral-400)",
          "variable-collection-orange-dark":
            "var(--variable-collection-orange-dark)",
          "variable-collection-orange-darker":
            "var(--variable-collection-orange-darker)",
          "variable-collection-orange-light":
            "var(--variable-collection-orange-light)",
          "variable-collection-orange-lighter":
            "var(--variable-collection-orange-lighter)",
          "variable-collection-purple-base":
            "var(--variable-collection-purple-base)",
          "variable-collection-purple-dark":
            "var(--variable-collection-purple-dark)",
          "variable-collection-purple-darker":
            "var(--variable-collection-purple-darker)",
          "variable-collection-purple-light":
            "var(--variable-collection-purple-light)",
          "variable-collection-purple-lighter":
            "var(--variable-collection-purple-lighter)",
          "variable-collection-red-base": "var(--variable-collection-red-base)",
          "variable-collection-red-dark": "var(--variable-collection-red-dark)",
          "variable-collection-red-light": "var(--variable-collection-red-light)",
          "variable-collection-red-lighter":
            "var(--variable-collection-red-lighter)",
          "variable-collection-teal-base": "var(--variable-collection-teal-base)",
          "variable-collection-teal-dark": "var(--variable-collection-teal-dark)",
          "variable-collection-teal-darker":
            "var(--variable-collection-teal-darker)",
          "variable-collection-yellow-base":
            "var(--variable-collection-yellow-base)",
          "variable-collection-yellow-dark":
            "var(--variable-collection-yellow-dark)",
          "variable-collection-yellow-darker":
            "var(--variable-collection-yellow-darker)",
          "variable-collection-yellow-light":
            "var(--variable-collection-yellow-light)",
          "variable-collection-yellow-lighter":
            "var(--variable-collection-yellow-lighter)",
          border: "hsl(var(--border))",
          input: "hsl(var(--input))",
          ring: "hsl(var(--ring))",
          background: "hsl(var(--background))",
          foreground: "hsl(var(--foreground))",
          primary: {
            DEFAULT: "hsl(var(--primary))",
            foreground: "hsl(var(--primary-foreground))",
          },
          secondary: {
            DEFAULT: "hsl(var(--secondary))",
            foreground: "hsl(var(--secondary-foreground))",
          },
          destructive: {
            DEFAULT: "hsl(var(--destructive))",
            foreground: "hsl(var(--destructive-foreground))",
          },
          muted: {
            DEFAULT: "hsl(var(--muted))",
            foreground: "hsl(var(--muted-foreground))",
          },
          accent: {
            DEFAULT: "hsl(var(--accent))",
            foreground: "hsl(var(--accent-foreground))",
          },
          popover: {
            DEFAULT: "hsl(var(--popover))",
            foreground: "hsl(var(--popover-foreground))",
          },
          card: {
            DEFAULT: "hsl(var(--card))",
            foreground: "hsl(var(--card-foreground))",
          },
        },
        borderRadius: {
          lg: "var(--radius)",
          md: "calc(var(--radius) - 2px)",
          sm: "calc(var(--radius) - 4px)",
        },
        fontFamily: {
          sans: [
            "ui-sans-serif",
            "system-ui",
            "sans-serif",
            '"Apple Color Emoji"',
            '"Segoe UI Emoji"',
            '"Segoe UI Symbol"',
            '"Noto Color Emoji"',
          ],
        },
        keyframes: {
          "accordion-down": {
            from: { height: "0" },
            to: { height: "var(--radix-accordion-content-height)" },
          },
          "accordion-up": {
            from: { height: "var(--radix-accordion-content-height)" },
            to: { height: "0" },
          },
        },
        animation: {
          "accordion-down": "accordion-down 0.2s ease-out",
          "accordion-up": "accordion-up 0.2s ease-out",
        },
      },
      container: { center: true, padding: "2rem", screens: { "2xl": "1400px" } },
    },
    plugins: [],
    darkMode: ["class"],
  };