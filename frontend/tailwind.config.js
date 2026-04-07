/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "primary": "#0df259", // Unified Vibrant Mint Green
                "bg-dark": "#0a0c10", // Deepest background
                "panel-dark": "#161b22", // Panel background
                "border-dark": "#30363d", // Borders
                "deep-indigo": "#0d1117", // Secondary deep background
                "muted-slate": "#475569",
                "slate-brand": "#1c2128",
                "accent-blue": "#3b82f6",
                "crimson-red": "#ff4d4d",
                "slate-muted": "#64748b",
                "border-subtle": "rgba(255,255,255,0.06)",
            },
            fontFamily: {
                "sans": ["Inter", "sans-serif"],
                "serif": ["Playfair Display", "serif"],
                "body-serif": ["Lora", "serif"],
            },
        },
    },
    plugins: [],
}
