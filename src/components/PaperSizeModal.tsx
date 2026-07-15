type PaperSize = "letter" | "legal" | "a4";

interface Props {
  open: boolean;
  onSelect: (size: PaperSize) => void;
  onCancel: () => void;
}

const SIZES: { key: PaperSize; label: string; dimensions: string }[] = [
  { key: "letter", label: "Letter", dimensions: "8.5 × 11 in" },
  { key: "legal", label: "Legal", dimensions: "8.5 × 14 in" },
  { key: "a4", label: "A4", dimensions: "210 × 297 mm" },
];

export default function PaperSizeModal({ open, onSelect, onCancel }: Props) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Export as PDF</h2>
        <p className="modal-subtitle">Choose a paper size</p>
        <div className="modal-options">
          {SIZES.map(({ key, label, dimensions }) => (
            <button
              key={key}
              className="modal-option"
              onClick={() => onSelect(key)}
            >
              <span className="modal-option-label">{label}</span>
              <span className="modal-option-dim">{dimensions}</span>
            </button>
          ))}
        </div>
        <button className="modal-cancel" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export type { PaperSize };
