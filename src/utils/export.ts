import html2canvas from "html2canvas";
import jsPDF from "jspdf";

function withPadding(element: HTMLElement): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.style.padding = "3em";
  wrapper.style.backgroundColor = "#ffffff";
  wrapper.style.width = `${Math.max(element.offsetWidth, 1100)}px`;
  wrapper.appendChild(element.cloneNode(true));
  return wrapper;
}

function renderWithPadding(element: HTMLElement): Promise<HTMLCanvasElement> {
  const wrapper = withPadding(element);
  document.body.appendChild(wrapper);
  return html2canvas(wrapper, {
    backgroundColor: "#ffffff",
    scale: 2,
    useCORS: true,
  }).finally(() => {
    document.body.removeChild(wrapper);
  });
}

export async function exportAsPNG(element: HTMLElement, filename = "schedule.png") {
  const canvas = await renderWithPadding(element);
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

export async function exportAsPDF(
  element: HTMLElement,
  format: "letter" | "legal" | "a4" = "a4",
  filename = "schedule.pdf",
) {
  const canvas = await renderWithPadding(element);
  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF("p", "mm", format);
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  const scale = Math.min(pdfWidth / canvas.width, pdfHeight / canvas.height);
  const imgWidth = canvas.width * scale;
  const imgHeight = canvas.height * scale;
  const x = (pdfWidth - imgWidth) / 2;
  const y = (pdfHeight - imgHeight) / 2;

  pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);
  pdf.save(filename);
}
