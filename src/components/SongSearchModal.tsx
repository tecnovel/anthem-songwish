import React from "react";

import SongSearch, { Track } from "./SongSearch";

type SongSearchModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (track: Track) => void;
  selectedTrackId?: string | null;
  initialQuery?: string;
};

const SongSearchModal: React.FC<SongSearchModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  selectedTrackId = null,
  initialQuery,
}) => {
  if (!isOpen) {
    return null;
  }

  const handleSelect = (track: Track) => {
    onSelect(track);
    onClose();
  };

  // Close when clicking the overlay (outside modal content)
  const handleOverlayMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // only close when the overlay itself is clicked, not children
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 px-3 py-10 sm:px-4"
      onMouseDown={handleOverlayMouseDown}
      role="presentation"
    >
      <div
        className="relative w-full max-w-lg rounded-3xl p-5 shadow-[0_28px_56px_rgba(0,0,0,0.6)] sm:max-w-2xl sm:p-7"
        style={{
          background:
            "linear-gradient(145deg, rgba(27,27,36,0.95), rgba(22,21,32,0.8))",
          border: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(26px)",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-lg text-gray-200 shadow-[0_6px_16px_rgba(0,0,0,0.4)] transition hover:bg-white/20 sm:h-10 sm:w-10"
          aria-label="Schließen"
        >
          <span aria-hidden>×</span>
        </button>
        <h2 className="mb-4 text-lg font-semibold text-white sm:text-xl">
          Song auswählen
        </h2>
        <div className="max-h-[70vh] overflow-y-auto pr-1">
          <SongSearch
            onSelect={handleSelect}
            selectedId={selectedTrackId ?? null}
            autoFocus
            initialQuery={initialQuery}
          />
        </div>
      </div>
    </div>
  );
};

export default SongSearchModal;
