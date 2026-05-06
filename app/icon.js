import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 192, height: 192 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div style={{
      width: 192, height: 192,
      background: "#0a0a0a",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 32,
    }}>
      <div style={{
        width: 140, height: 3,
        background: "linear-gradient(to right, #c8b89a, #8a7a6a)",
        borderRadius: 2,
        marginBottom: 20,
      }} />
      <span style={{
        fontSize: 64,
        fontWeight: 700,
        color: "#c8b89a",
        fontFamily: "serif",
        letterSpacing: -2,
        lineHeight: 1,
      }}>D</span>
      <span style={{
        fontSize: 20,
        color: "#555",
        fontFamily: "monospace",
        letterSpacing: 4,
        marginTop: 6,
      }}>AI</span>
    </div>,
    { ...size }
  );
}
