"use client";

import { useEffect } from "react";

// Replaces the root layout when it fails, so it brings its own <html>, <body>
// and styles: globals.css, the fonts and the translations aren't available here.
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          background: "#0e0e0e",
          color: "#ffffff",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          textAlign: "center",
        }}
      >
        <title>Something went wrong</title>
        <div role="alert" style={{ maxWidth: "32rem" }}>
          <h1 style={{ margin: 0, fontSize: "1.875rem", lineHeight: 1.2 }}>Something went wrong</h1>
          <p style={{ margin: "16px 0 0", color: "rgba(255,255,255,0.7)" }}>
            The page could not be loaded. Please try again in a moment.
          </p>
          <button
            type="button"
            onClick={() => retry()}
            style={{
              marginTop: "32px",
              padding: "12px 24px",
              border: 0,
              borderRadius: "9999px",
              background: "#fc701c",
              color: "#0e0e0e",
              fontSize: "1rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
