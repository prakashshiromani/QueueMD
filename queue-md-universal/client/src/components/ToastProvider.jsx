import { Toaster } from "react-hot-toast";

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: "var(--bg-secondary)",
          color: "var(--text-primary)",
          border: "1px solid var(--border-muted)",
          borderRadius: "12px",
          padding: "16px",
          fontSize: "14px",
          fontWeight: "600",
          backdropFilter: "blur(12px)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
        },
        success: {
          iconTheme: {
            primary: "#10B981",
            secondary: "#FFFFFF",
          },
          style: {
            borderLeft: "4px solid #10B981",
          },
        },
        error: {
          iconTheme: {
            primary: "#EF4444",
            secondary: "#FFFFFF",
          },
          style: {
            borderLeft: "4px solid #EF4444",
          },
        },
        loading: {
          iconTheme: {
            primary: "#3B82F6",
            secondary: "#FFFFFF",
          },
        },
      }}
    />
  );
}
