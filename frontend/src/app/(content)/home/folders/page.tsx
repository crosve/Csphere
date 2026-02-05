"use client";
import { useState, useEffect } from "react";
import FolderLayout from "./FolderLayout";
import { ChevronDown } from "lucide-react";
import FolderCard from "./foldercomponents/FolderCard";
import { createFolder } from "./functions/foldercreate";
import { toast } from "sonner";
import { fetchHomeFolders } from "./functions/folderfetch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { fetchToken } from "@/functions/user/UserData";

import { UUID } from "crypto";

interface FolderDetail {
  folderId: string;
  createdAt: string;
  folderName: string;
  parentId: string;
  fileCount: number;
}

interface ResponseModel {
  success: boolean;
  message: string;
}

const sortOptions = ["Latest", "Oldest", "Name A-Z", "Name Z-A"];

function page() {
  const [open, setOpen] = useState(false);
  const [sortBy, setSortBy] = useState("Latest");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [folders, setFolders] = useState<FolderDetail[]>([]);

  useEffect(() => {
    const updateFolderPosition = () => {
      switch (sortBy.trim()) {
        case "Latest":
          setFolders((prev) => {
            const sorted = [...prev].sort((a, b) => {
              const aDate = new Date(a.createdAt);
              const bDate = new Date(b.createdAt);
              return aDate.getTime() - bDate.getTime();
            });
            return sorted;
          });

          break;
        case "Oldest":
          setFolders((prev) => {
            const sorted = [...prev].sort((a, b) => {
              const aDate = new Date(a.createdAt);
              const bDate = new Date(b.createdAt);
              return aDate.getTime() - bDate.getTime();
            });
            return sorted;
          });

          break;
        case "Name A-Z":
          setFolders((prev) => {
            const sorted = [...prev].sort((a, b) => {
              return a.folderName
                .toLocaleLowerCase()
                .localeCompare(b.folderName.toLocaleLowerCase());
            });
            return sorted;
          });

          break;

        case "Name Z-A":
          setFolders((prev) => {
            const sorted = [...prev]
              .sort((a, b) => {
                return a.folderName
                  .toLocaleLowerCase()
                  .localeCompare(b.folderName.toLocaleLowerCase());
              })
              .reverse();
            return sorted;
          });

          break;
        default:
          console.log("Sorting option not available");
      }
    };

    updateFolderPosition();
  }, [sortBy]);

  const handleFolderDelete = async (folderId: UUID) => {
    try {
      const APIURL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/folder/${folderId}`;
      const token = fetchToken();

      const response = await fetch(APIURL, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data: ResponseModel = await response.json();

      if (data && data.success) {
        console.log("successfully deleted");
        setFolders((prev) =>
          prev.filter((folder) => folder.folderId != folderId),
        );

        toast.success("Folder succesfully deleted");
      } else {
        console.log("An error occured on the server: ", data.message);
      }
    } catch (error) {
      console.log("error occured in handleFolerDelete: ", error);
      toast.error("Error occured when trying to delete folder");
    }
  };

  interface FolderCreateProps {
    foldername: string;
    folderId: string | null;
  }

  useEffect(() => {
    const fetchFolders = async () => {
      const folderData = await fetchHomeFolders();
      console.log("folder details being returned: ", folderData);
      setFolders(folderData);
    };

    fetchFolders();
  }, []);

  const createNewFolder = async () => {
    console.log("folder name: ", folderName);
    if (!folderName?.trim()) {
      return;
    }

    const folderData: FolderCreateProps = {
      foldername: folderName.trim(),
      folderId: null, // Set this dynamically if you want nested folders
    };

    try {
      const folder_details = await createFolder(folderData);
      console.log("folder details being returned:", folder_details);

      if (folder_details) {
        const newFolder: FolderDetail = {
          folderId: folder_details.folder_id,
          createdAt: folder_details.created_at,
          folderName: folder_details.folder_name,
          parentId: folder_details.parent_id,
          fileCount: folder_details.file_count,
        };
        setFolders((prev) => [newFolder, ...prev]);
        toast.success("Folder created succesfully");
      }
    } catch (error) {
      console.error("Error creating folder:", error);
      // Optionally show an error toast or message
    }
  };

  return (
    <>
      <div className="w-full space-y-6 gap-4 mb-4">
        <div className="flex items-center gap-3 mb-8">
          {/* New Button */}
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <button className="bg-[#202A29] hover:bg-[#435856] text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors">
                New
              </button>
            </PopoverTrigger>

            <PopoverContent
              align="start"
              sideOffset={20}
              // alignOffset={20}
              className="w-96 bg-gray-100"
            >
              <div className="flex flex-1 flex-col text-white space-y-4 p-1">
                <h1 className="text-white font-semibold text-lg">New Folder</h1>
                <input
                  id="folder-name-input"
                  placeholder="Enter folder name"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  className="border border-black focus:border-gray-300 focus:outline-none text-black px-3 py-2 rounded-md"
                />
                <div className="flex items-end w-full justify-end space-x-3 text-black">
                  <button
                    className="rounded-lg hover:bg-amber-50 px-3 py-1.5 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
                    onClick={() => setOpen(!open)}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createNewFolder}
                    className="rounded-lg px-3 py-1.5 bg-[#202A29] text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Create
                  </button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Sort By Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3 6h18M7 12h10M11 18h2"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              Sort By: {sortBy}
              <ChevronDown
                size={16}
                className={`transition-transform ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                {sortOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setSortBy(option);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg transition-colors ${
                      sortBy === option
                        ? "bg-blue-50 text-gray-600"
                        : "text-gray-700"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <h2>Folders</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {folders?.map((folder, index) => (
          <FolderCard
            key={index}
            title={folder.folderName}
            fileCount={folder.fileCount}
            folderId={folder.folderId}
            handleFolderDelete={handleFolderDelete}
          />
        ))}
      </div>
    </>
  );
}

export default page;
