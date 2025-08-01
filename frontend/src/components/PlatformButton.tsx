import React from 'react';

type PlatformButtonProps = {
  platform: "slack" | "instagram"| "gmail";
  onClick: () => void;
  inProgress?: boolean;
  comingSoon?: boolean;
};

const PlatformButton = ({ platform, onClick, inProgress, comingSoon }: PlatformButtonProps) => {
  const iconMap = {
    slack: 'https://www.google.com/s2/favicons?domain=slack.com&sz=32',
    instagram: 'https://www.google.com/s2/favicons?domain=instagram.com&sz=32',
    gmail: 'https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico'
  };

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center p-3 hover:bg-gray-100 rounded-lg text-[15px] w-full"
    >
      <img src={iconMap[platform]} alt={platform} className="w-8 h-8 mb-1.5" />
      <span className="whitespace-nowrap">
        {platform.charAt(0).toUpperCase() + platform.slice(1)}
        {inProgress && <><br />(Preview)</>}
        {comingSoon && <><br />(Coming)</>}
      </span>
    </button>
  );
};

export default PlatformButton;