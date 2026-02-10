import React, { useEffect, useState, useRef } from "react";
import { fetchToken } from "@/functions/user/UserData";
import { toast } from "sonner";
import ShareModal from "./ShareModal";
import ArchiveModal from "@/app/(content)/home/ArchiveModal";
interface BookMarkSettingProps {
  content_id: string;
  url: string;
  folder_bookmark?: boolean;
}

interface FolderProps {
  folder_id: string;
  folder_name: string;
}

// Nested Popover for folders
const FolderPopover = ({
  onAddToFolder,
}: {
  onAddToFolder: (folder: any) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [folders, setFolders] = useState<FolderProps[]>([]);

  const timeoutRef = useRef(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200); // 200ms delay
  };

  useEffect(() => {
    const fetchUsersFolders = async () => {
      try {
        const API_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/users/folders`;

        const token = fetchToken();
        const response = await fetch(API_URL, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        console.log("data being returned: ", data);

        setFolders(data.data);
      } catch (error) {
        console.log("error occured in fetchUsersFolders");
      }
    };
    fetchUsersFolders();
  }, []);

  return (
    <div className="relative">
      <div
        className="cursor-pointer hover:bg-gray-200 p-2 rounded transition-colors"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <p className="text-gray-700">Add to folder</p>
      </div>

      {isOpen && (
        <div
          className="absolute left-full top-0 ml-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="p-2">
            <div className="text-sm font-medium text-gray-900 mb-2 px-2">
              Select Folder
            </div>
            <hr className="text-gray-400" />
            <div className="max-h-60 overflow-y-auto">
              {folders.map((folder) => (
                <div
                  key={folder.folder_id}
                  className="flex items-center justify-between px-2 py-2 hover:bg-gray-100 rounded cursor-pointer transition-colors"
                  onClick={() => onAddToFolder(folder)}
                >
                  <span className="text-sm text-gray-700">
                    {folder.folder_name}
                  </span>
                  {/* <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                    {folder.count}
                  </span> */}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function BookMarkSettingIcon({
  content_id,
  url,
  folder_bookmark = false,
}: BookMarkSettingProps) {
  const [mainPopoverOpen, setMainPopoverOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [archiveUrl, setArchiveUrl] = useState("");
  const handleAddToFolder = async (folder: FolderProps) => {
    try {
      const API_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/users/folder/add`;
      const token = fetchToken();

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          folderId: folder.folder_id,
          contentId: content_id,
        }),
      });

      const data = await response.json();
      if (data.success === true) {
        toast.success("item added to the folder");
      }
    } catch (error) {
      console.log("error in adding bookmark to folder", error);
    }
  };

  const handleView = async (content_id: string) => {
    try {
      const API_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/content/${content_id}/archive`;
      const token = fetchToken();
      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      // Assuming backend returns { "url": "..." }
      if (data.url) {
        setArchiveUrl(data.url);
        setArchiveModalOpen(true);
        setMainPopoverOpen(false);
      } else {
        toast.error("Archive not found for this item");
      }
    } catch (error) {
      console.log("Error fetching archive: ", error);
      toast.error("Failed to load archive");
    }
  };

  return (
    <div className="">
      <div className="relative">
        <button
          className="text-black md:ml-2 lg:ml-3 text-xl"
          onClick={() => setMainPopoverOpen(!mainPopoverOpen)}
        >
          ⋮
        </button>

        {mainPopoverOpen && (
          <div className="absolute top-full left-0 -translate-x-80 md:-translate-x-52 mt-5 w-40 bg-gray-100 border border-gray-200 rounded-lg shadow-lg z-40">
            {" "}
            <div className="flex flex-1 flex-col space-y-1 p-1">
              {!folder_bookmark && (
                <FolderPopover onAddToFolder={handleAddToFolder} />
              )}

              {/* Open the saved content html */}
              <div className="cursor-pointer hover:bg-gray-200 p-2 rounded transition-colors">
                <p
                  onClick={() => {
                    console.log("handle view placeholder");
                    handleView(content_id);
                  }}
                  className="text-gray-700"
                >
                  View{" "}
                </p>
              </div>

              {/* Other menu items */}
              <div className="cursor-pointer hover:bg-gray-200 p-2 rounded transition-colors">
                <p className="text-gray-700">Edit bookmark</p>
              </div>
              <div
                className="cursor-pointer hover:bg-gray-200 p-2 rounded transition-colors"
                onClick={() => {
                  setMainPopoverOpen(false);
                  setShareModalOpen(true);
                }}
              >
                <p className="text-gray-700">Share</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {mainPopoverOpen && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setMainPopoverOpen(false)}
        />
      )}
      {shareModalOpen && (
        <ShareModal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          bookmarkUrl={url}
        />
      )}
      {archiveModalOpen && (
        <ArchiveModal
          isOpen={archiveModalOpen}
          onClose={() => {
            setArchiveModalOpen(false);
            setArchiveUrl(""); // Clear URL on close
          }}
          archiveUrl={archiveUrl}
        />
      )}
    </div>
  );
}

export default BookMarkSettingIcon;
