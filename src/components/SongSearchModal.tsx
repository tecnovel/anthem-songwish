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
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 px-3 py-10 sm:px-4"
      onMouseDown={handleOverlayMouseDown}
      role="presentation"
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-4 shadow-xl sm:max-w-2xl sm:p-6">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-lg text-gray-700 shadow-sm transition hover:bg-gray-50 sm:h-10 sm:w-10"
          aria-label="Schließen"
        >
          <span aria-hidden>×</span>
        </button>
        <h2 className="mb-4 text-lg font-semibold text-gray-900 sm:text-xl">
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
