import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "CalmPath, student stress first-aid";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "#f4f0e8",
          color: "#1a2b26",
        }}
      >
        <div
          style={{
            fontSize: 22,
            color: "#2a6b5a",
            letterSpacing: 4,
            textTransform: "uppercase",
            marginBottom: 20,
          }}
        >
          Student wellbeing first-aid
        </div>
        <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.05 }}>
          Two minutes.
        </div>
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            lineHeight: 1.05,
            color: "#2a6b5a",
          }}
        >
          A clear next week.
        </div>
        <div style={{ fontSize: 28, marginTop: 28, color: "#5c6b66", maxWidth: 900 }}>
          Clear score. Safety plan when needed. Not a diagnosis.
        </div>
      </div>
    ),
    size,
  );
}
