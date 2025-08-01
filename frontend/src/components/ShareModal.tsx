import React from 'react';
import { shareTo } from '@/lib/utils';
import PlatformButton from './PlatformButton';

const ShareModal = ({ onClose, bookmarkUrl }) => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg p-6 w-80">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Share</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">
            x
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          {/* Slack Button */}
          <PlatformButton 
            platform="slack" 
            onClick={() => handleShare('slack')} 
            comingSoon
          />

          {/* Instagram Button */}
          <PlatformButton 
            platform="instagram" 
            onClick={() => handleShare('instagram')} 
            comingSoon 
          />

          {/* Gmail Button */}
          <PlatformButton 
            platform="gmail" 
            onClick={() => handleShare('gmail')} 
          />
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
            className="bg-blue-500 text-white px-4 py-2 rounded-r hover:bg-blue-600 text-[15px]"
            >
            {copiedUrl ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;