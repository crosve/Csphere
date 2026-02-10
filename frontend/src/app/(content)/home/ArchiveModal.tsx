import { useState } from "react";
interface ArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  archiveUrl: string;
}

const ArchiveModal = ({ isOpen, onClose, archiveUrl }: ArchiveModalProps) => {
  const [isIframeLoading, setIsIframeLoading] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-6xl h-[90vh] rounded-xl overflow-hidden flex flex-col shadow-2xl relative">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h3 className="font-semibold text-gray-800">Permanent Snapshot</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body Container */}
        <div className="flex-grow bg-white relative">
          {/* Loader Overlay */}
          {isIframeLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10">
              <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
              <p className="mt-4 text-sm text-gray-500 font-medium">
                Restoring snapshot...
              </p>
            </div>
          )}

          <iframe
            src={archiveUrl}
            className={`w-full h-full border-none transition-opacity duration-300 ${
              isIframeLoading ? "opacity-0" : "opacity-100"
            }`}
            sandbox="allow-same-origin"
            title="Content Archive"
            onLoad={() => setIsIframeLoading(false)}
          />
        </div>
      </div>
    </div>
  );
};
export default ArchiveModal;
