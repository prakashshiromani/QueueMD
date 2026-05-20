/** @type {import('tailwindcss').Config} */
import forms from '@tailwindcss/forms';
import containerQueries from '@tailwindcss/container-queries';

export default {
        darkMode: "class",
        content: [
                "./index.html",
                "./src/**/*.{js,ts,jsx,tsx}",
        ],
        theme: {
                extend: {
                        "colors": {
                                "on-primary-fixed-variant": "#003ea8",
                                "status-info": "#3B82F6",
                                "text-secondary": "var(--text-secondary)",
                                "on-background": "#e1e2ed",
                                "tertiary-container": "#bc4800",
                                "secondary": "#4edea3",
                                "on-secondary-fixed": "#002113",
                                "surface-container-high": "#282a32",
                                "outline": "#8d90a0",
                                "surface": "#11131b",
                                "surface-bright": "#373942",
                                "facility-dental": "#EC4899",
                                "status-error": "#EF4444",
                                "on-error-container": "#ffdad6",
                                "surface-tint": "#b4c5ff",
                                "secondary-fixed": "#6ffbbe",
                                "secondary-container": "#00a572",
                                "outline-variant": "#434655",
                                "status-warning": "#F59E0B",
                                "primary": "#b4c5ff",
                                "on-primary": "#002a78",
                                "surface-container-low": "#191b23",
                                "status-success": "#10B981",
                                "on-tertiary-fixed": "#360f00",
                                "surface-dim": "#11131b",
                                "on-secondary-container": "#00311f",
                                "inverse-primary": "#0053db",
                                "border-muted": "var(--border-muted)",
                                "facility-physio": "#14B8A6",
                                "tertiary-fixed": "#ffdbcd",
                                "on-primary-fixed": "#00174b",
                                "background": "#11131b",
                                "facility-pathlab": "#7C3AED",
                                "tertiary-fixed-dim": "#ffb596",
                                "text-primary": "var(--text-primary)",
                                "tertiary": "#ffb596",
                                "on-surface": "#e1e2ed",
                                "error-container": "#93000a",
                                "on-secondary": "#003824",
                                "inverse-surface": "#e1e2ed",
                                "surface-container": "#1d1f27",
                                "on-primary-container": "#eeefff",
                                "secondary-fixed-dim": "#4edea3",
                                "surface-container-highest": "#32343d",
                                "primary-container": "var(--primary-container)",
                                "on-error": "#690005",
                                "on-tertiary": "#581e00",
                                "surface-container-lowest": "#0c0e16",
                                "inverse-on-surface": "#2e3039",
                                "bg-primary": "var(--bg-primary)",
                                "bg-secondary": "var(--bg-secondary)",
                                "surface-variant": "var(--surface-variant)",
                                "error": "#ffb4ab",
                                "on-tertiary-fixed-variant": "#7d2d00",
                                "on-surface-variant": "#c3c6d7",
                                "primary-fixed-dim": "#b4c5ff",
                                "primary-fixed": "#dbe1ff",
                                "on-tertiary-container": "#ffede6",
                                "on-secondary-fixed-variant": "#005236"
                        },
                        "borderRadius": {
                                "DEFAULT": "0.25rem",
                                "lg": "0.5rem",
                                "xl": "0.75rem",
                                "full": "9999px"
                        },
                        "spacing": {
                                "space-12": "48px",
                                "space-6": "24px",
                                "space-1": "4px",
                                "base": "8px",
                                "space-5": "20px",
                                "space-2": "8px",
                                "space-8": "32px",
                                "space-10": "40px",
                                "space-4": "16px",
                                "space-3": "12px"
                        },
                        "fontFamily": {
                                "label-bold": [
                                        "Inter", "sans-serif"
                                ],
                                "body-base": [
                                        "Inter", "sans-serif"
                                ],
                                "display-xl": [
                                        "Inter", "sans-serif"
                                ],
                                "caption-xs": [
                                        "Inter", "sans-serif"
                                ],
                                "heading-md": [
                                        "Inter", "sans-serif"
                                ],
                                "display-lg": [
                                        "Inter", "sans-serif"
                                ],
                                "body-sm": [
                                        "Inter", "sans-serif"
                                ]
                        },
                        "fontSize": {
                                "label-bold": [
                                        "14px",
                                        {
                                                "lineHeight": "1",
                                                "fontWeight": "600"
                                        }
                                ],
                                "body-base": [
                                        "16px",
                                        {
                                                "lineHeight": "1.5",
                                                "fontWeight": "400"
                                        }
                                ],
                                "display-xl": [
                                        "30px",
                                        {
                                                "lineHeight": "1.2",
                                                "fontWeight": "700"
                                        }
                                ],
                                "caption-xs": [
                                        "12px",
                                        {
                                                "lineHeight": "1",
                                                "fontWeight": "400"
                                        }
                                ],
                                "heading-md": [
                                        "20px",
                                        {
                                                "lineHeight": "1.3",
                                                "fontWeight": "600"
                                        }
                                ],
                                "display-lg": [
                                        "24px",
                                        {
                                                "lineHeight": "1.25",
                                                "fontWeight": "600"
                                        }
                                ],
                                "body-sm": [
                                        "14px",
                                        {
                                                "lineHeight": "1.5",
                                                "fontWeight": "400"
                                        }
                                ]
                        }
                },
        },
        plugins: [
                forms,
                containerQueries
        ],
}
