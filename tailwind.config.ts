import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Earth palette — drives every surface unless overridden
        parchment: "var(--ct-parchment)",
        ink: "var(--ct-ink)",
        ink2: "var(--ct-ink-2)",
        ink3: "var(--ct-ink-3)",
        bone: "var(--ct-bone)",
        terracotta: "var(--ct-terracotta)",
        terracotta2: "var(--ct-terracotta-2)",
        ochre: "var(--ct-ochre)",
        forest: "var(--ct-forest)",
        teal: "var(--ct-teal)",
        rust: "var(--ct-rust)",
        crisis: "var(--ct-crisis)",
        line: "var(--ct-line)"
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"]
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
        pill: "var(--radius-pill)"
      },
      boxShadow: {
        soft: "0 1px 2px rgba(28,22,18,.04), 0 8px 24px rgba(28,22,18,.06)",
        ring: "0 0 0 1px var(--ct-line)"
      },
      maxWidth: {
        prose: "68ch",
        shell: "1200px"
      }
    }
  },
  plugins: []
};

export default config;
