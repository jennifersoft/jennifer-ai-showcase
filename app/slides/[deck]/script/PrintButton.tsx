"use client";

export default function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} style={{ font: "inherit", cursor: "pointer" }}>
      인쇄 / PDF 저장
    </button>
  );
}
