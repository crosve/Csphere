import React from "react";
import { shareTo } from "@/lib/utils";
import PlatformButton from "./PlatformButton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PlatformProps {
  platform: "slack" | "instagram" | "gmail" | "messages";
}

const PlatformValues: PlatformProps[] = [
  {
    platform: "slack",
  },
  {
    platform: "instagram",
  },
  {
    platform: "gmail",
  },
  {
    platform: "messages",
  }
];

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookmarkUrl: string;
}

const ShareModal = ({ isOpen, onClose, bookmarkUrl }: ShareModalProps) => {
  const [copiedUrl, setCopiedUrl] = React.useState(false);

  const handleShare = async (platform: keyof typeof shareTo) => {
    const { message } = await shareTo[platform](bookmarkUrl);
    if (message) alert(message);
    onClose();
  };

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(bookmarkUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="bg-white rounded-lg p-6 w-[500px]">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-lg font-medium">Share</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-4 gap-4 mb-4">
          {PlatformValues.map((platformProp, index) => (
            <PlatformButton
              key={index}
              platform={platformProp.platform}
              onClick={() => handleShare(platformProp.platform)}
            />
          ))}
        </div>

        <div className="flex">
          <input
            type="text"
            value={bookmarkUrl}
            readOnly
            className="flex-1 border border-gray-300 rounded-l px-3 py-2 text-[15px]"
          />
          <button
            onClick={handleCopyUrl}
            className="bg-black/80 text-white px-4 py-2 rounded-r hover:bg-black/60 text-[15px]"
          >
            {copiedUrl ? "Copied!" : "Copy"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareModal;
