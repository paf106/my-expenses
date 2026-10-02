import { ImageResponse } from "next/og";

export const contentType = "image/png";
export const size = { width: 512, height: 512 };

export function GET() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#16213a" }}>
      <svg width="300" height="300" viewBox="0 0 64 64" fill="none">
        <path d="M39 14H24c-7 0-11 4-11 10s4 9 11 10l15 2c7 1 11 4 11 10S46 56 39 56H13" stroke="#f3f5f8" strokeLinecap="round" strokeWidth="5" />
        <path d="M32 7v50" stroke="#53c99d" strokeLinecap="round" strokeWidth="4" />
      </svg>
    </div>,
    size,
  );
}
