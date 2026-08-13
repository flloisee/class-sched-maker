import { useRef, useState } from "react";
import "./PaperSizeModal.css";
import "./ShareModal.css";

interface Props {
  open: boolean;
  url: string;
  onClose: () => void;
}

export default function ShareModal({ open, url, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  function handleCopy() {
    const clip = navigator.clipboard;
    if (clip) {
      clip
        .writeText(url)
        .then(() => {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2000);
        })
        .catch(() => inputRef.current?.select());
    } else {
      inputRef.current?.select();
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card modal-card--share" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Share schedule</h2>
        <p className="modal-subtitle">Anyone with this link can open the schedule.</p>
        <div className="share-link-row">
          <input
            ref={inputRef}
            className="share-link-field"
            readOnly
            value={url}
            onFocus={(e) => e.target.select()}
          />
          <button className="share-copy-btn" onClick={handleCopy}>
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <button className="modal-cancel" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}