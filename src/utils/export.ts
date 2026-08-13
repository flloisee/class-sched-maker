import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { embedSchedule } from "./png";

function getThemeBgHex(): string {
  return getComputedStyle(document.documentElement).getPropertyValue("--bg-hex").trim() || "#F7F6F2";
}

const EXPORT_SCHEDULE_WIDTH = 1060;

function withPadding(element: HTMLElement): HTMLElement {
  const clone = element.cloneNode(true) as HTMLElement;
  clone.classList.add("schedule-compact");
  const wrapper = document.createElement("div");
  wrapper.style.padding = "3em";
  wrapper.style.backgroundColor = getThemeBgHex();
  wrapper.style.width = `${EXPORT_SCHEDULE_WIDTH}px`;
  wrapper.appendChild(clone);
  return wrapper;
}

function renderWithPadding(element: HTMLElement): Promise<HTMLCanvasElement> {
  const wrapper = withPadding(element);
  document.body.appendChild(wrapper);
  return html2canvas(wrapper, {
    backgroundColor: getThemeBgHex(),
    scale: 2,
    useCORS: true,
  }).finally(() => {
    document.body.removeChild(wrapper);
  });
}

export async function exportAsPNG(element: HTMLElement, filename = "schedule.png", payload?: string) {
  const canvas = await renderWithPadding(element);
  const link = document.createElement("a");
  link.download = filename;
  const dataUrl = canvas.toDataURL("image/png");
  link.href = payload !== undefined ? embedSchedule(dataUrl, payload) : dataUrl;
  link.click();
}

function toHexString(bytes: Uint8Array): string {
  let hex = "";
  for (const byte of bytes) hex += byte.toString(16).padStart(2, "0");
  return hex;
}

function withScheduleInTrailer(pdfBytes: Uint8Array<ArrayBuffer>, payload: string): Uint8Array<ArrayBuffer> {
  const needle = new TextEncoder().encode("/Info ");
  const insert = new TextEncoder().encode(` /Schedule <${toHexString(new TextEncoder().encode(payload))}>`);
  for (let i = 0; i + needle.length <= pdfBytes.length; i++) {
    let match = true;
    for (let j = 0; j < needle.length; j++) {
      if (pdfBytes[i + j] !== needle[j]) {
        match = false;
        break;
      }
    }
    if (!match) continue;
    const rest = pdfBytes.subarray(i);
    const out = new Uint8Array(pdfBytes.length + insert.length);
    out.set(pdfBytes.subarray(0, i));
    out.set(insert, i);
    out.set(rest, i + insert.length);
    return out;
  }
  return pdfBytes;
}

const SCHEDULE_MARKER = "/Schedule <";

export function extractScheduleFromPDF(pdfBytes: Uint8Array): string {
  const latin = new TextDecoder("latin1").decode(pdfBytes);
  const start = latin.indexOf(SCHEDULE_MARKER);
  if (start === -1) throw new Error("No embedded schedule found in PDF");
  const hexStart = start + SCHEDULE_MARKER.length;
  const end = latin.indexOf(">", hexStart);
  if (end === -1) throw new Error("Malformed embedded schedule in PDF");
  const hex = latin.slice(hexStart, end).replace(/\s+/g, "");
  if (hex.length % 2 !== 0) throw new Error("Malformed embedded schedule in PDF");
  const textBytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < textBytes.length; i++) {
    textBytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return new TextDecoder().decode(textBytes);
}

export async function exportAsPDF(
  element: HTMLElement,
  format: "letter" | "legal" | "a4" = "a4",
  filename = "schedule.pdf",
  payload?: string,
) {
  const canvas = await renderWithPadding(element);
  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF("p", "mm", format);
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  const bgHex = getThemeBgHex();
  pdf.setFillColor(bgHex);
  pdf.rect(0, 0, pdfWidth, pdfHeight, "F");

  const scale = Math.min(pdfWidth / canvas.width, pdfHeight / canvas.height);
  const imgWidth = canvas.width * scale;
  const imgHeight = canvas.height * scale;
  const x = (pdfWidth - imgWidth) / 2;
  const y = (pdfHeight - imgHeight) / 2;

  pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);

  const raw = pdf.output("arraybuffer") as ArrayBuffer;
  const bytes = payload !== undefined ? withScheduleInTrailer(new Uint8Array(raw), payload) : new Uint8Array(raw);
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
