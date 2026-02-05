"use client";
import { useReducer } from "react";
import { Button } from "@/components/ui/button";
import { Grid3X3, List } from "lucide-react";
import { TabsList } from "@/components/ui/tabs";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import AddBookmarkPopover from "./AddBookmarkPopover";

export type ViewMode = "grid" | "list";

type BookmarkToolbarProps = {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  unreadCount: number;
};

export function BookmarkToolbar({
  viewMode,
  onViewModeChange,
  unreadCount,
}: BookmarkToolbarProps) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between mt-4 mb-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Your Bookmarks
          </h2>
          <p className="text-gray-600">
            Organize and rediscover your saved content
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <AddBookmarkPopover />
          <div className="flex border rounded-lg border-black">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange("grid")}
              className={`rounded-r-none border-gray-700 ${
                viewMode === "grid"
                  ? "bg-[#202A29] text-white"
                  : "bg-transparent text-[#202A29]"
              }`}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>

            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange("list")}
              className={`rounded-l-none border-gray-700 ${
                viewMode === "list"
                  ? "bg-[#202A29] text-white"
                  : "bg-transparent text-[#202A29]"
              }`}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <TabsList className="grid w-auto max-w-4xl grid-cols-5 p-0 mb-2 border rounded-lg bg-transparent border-black">
        <Link
          href="/home"
          className={`flex items-center h-full justify-center space-x-2 rounded-l-lg border-r border-gray-700 transition-colors ${
            pathname === "/home"
              ? "bg-[#202A29] text-white"
              : "bg-transparent text-[#202A29] hover:bg-gray-100"
          }`}
        >
          <span>Latest</span>
        </Link>

        <Link
          href="/home/unread"
          className={`flex items-center h-full justify-center space-x-2 border-r border-gray-700 transition-colors ${
            pathname === "/home/unread"
              ? "bg-[#202A29] text-white"
              : "bg-transparent text-[#202A29] hover:bg-gray-100"
          }`}
        >
          <span>Unread</span>
          <Badge variant="secondary" className="ml-1 bg-[#202A29] text-white">
            {unreadCount}
          </Badge>
        </Link>
        <Link
          href="/home/rediscover"
          className={`flex items-center h-full justify-center space-x-2 border-r border-gray-700 transition-colors ${
            pathname === "/home/rediscover"
              ? "bg-[#202A29] text-white"
              : "bg-transparent text-[#202A29] hover:bg-gray-100"
          }`}
        >
          <span>Rediscover</span>
          {/* <Badge variant="secondary" className="ml-1 bg-[#202A29] text-white">
            New
          </Badge> */}
        </Link>

        <Link
          href="/home/tags"
          className={`flex items-center h-full justify-center space-x-2 border-r border-gray-700 transition-colors ${
            pathname === "/home/tags"
              ? "bg-[#202A29] text-white"
              : "bg-transparent text-[#202A29] hover:bg-gray-100"
          }`}
        >
          <span>Tags</span>
        </Link>

        <Link
          href="/home/folders"
          className={`flex items-center h-full justify-center space-x-2 rounded-r-lg border-gray-700 transition-colors ${
            pathname === "/home/folders"
              ? "bg-[#202A29] text-white"
              : "bg-transparent text-[#202A29] hover:bg-gray-100"
          }`}
        >
          <span>Folders</span>
        </Link>
      </TabsList>
    </div>
  );
}
