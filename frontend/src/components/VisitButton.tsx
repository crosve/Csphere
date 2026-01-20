import React from "react";

interface VisitButtonProps {
    url: string,
    contentId: string,
    onVisit?: () => Promise<void> | void;
}

export function VisitButton({ url, contentId, onVisit }: VisitButtonProps){
    const handleClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.stopPropagation();
    
        if (onVisit) {
            await onVisit();
        }
    };
    
    return (
        <a
            href={url}
            onClick={handleClick}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border border-black rounded-md px-3 py-1 text-sm text-black hover:bg-[#202A29] hover:text-white transition-colors"
        >
            Visit
        </a>
    )
}