"use client";

import { Button } from "@/components/ui/button";
import { Grid3X3, List } from "lucide-react";
import { TabsList } from "@/components/ui/tabs";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import AddBookmarkPopover from "./AddBookmarkPopover";
import { motion } from "framer-motion";

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

  // Define your tabs in an array for cleaner mapping and animation handling
  const tabs = [
    { label: "Latest", href: "/home" },
    { label: "Unread", href: "/home/unread", count: unreadCount },
    { label: "Rediscover", href: "/home/rediscover" },
    { label: "Tags", href: "/home/tags" },
    { label: "Folders", href: "/home/folders" },
  ];

  return (
    <div className="flex flex-col space-y-6">
      {/* Top Header Section */}
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

          {/* View Mode Toggle */}
          <div className="flex border rounded-lg border-black overflow-hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewModeChange("grid")}
              className={`rounded-none px-4 transition-colors ${
                viewMode === "grid"
                  ? "bg-[#202A29] text-white hover:bg-[#202A29]"
                  : "bg-transparent text-[#202A29] hover:bg-gray-100"
              }`}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewModeChange("list")}
              className={`rounded-none px-4 border-l border-black transition-colors ${
                viewMode === "list"
                  ? "bg-[#202A29] text-white hover:bg-[#202A29]"
                  : "bg-transparent text-[#202A29] hover:bg-gray-100"
              }`}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs with Sliding Animation */}
      <TabsList className="relative grid w-auto max-w-4xl grid-cols-5 p-0 mb-2 border rounded-lg bg-transparent border-black overflow-hidden h-12">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`relative h-full  flex items-center justify-center space-x-2 border-r border-gray-700 last:border-r-0 transition-colors duration-300 ${
                isActive ? "text-white" : "text-[#202A29] hover:bg-gray-100/50"
              }`}
            >
              {/* This is the label - higher Z-index to sit on top of the moving pill */}
              <span className="relative z-10 font-medium text-sm rounded-2xl">
                {tab.label}
              </span>

              {tab.count !== undefined && tab.count > 0 && (
                <Badge
                  variant="secondary"
                  className={`relative z-10 ml-1 text-[10px] px-1.5 py-0 transition-colors ${
                    isActive
                      ? "bg-white text-[#202A29]"
                      : "bg-[#202A29] text-white"
                  }`}
                >
                  {tab.count}
                </Badge>
              )}

              {/* Framer Motion LayoutId Magic */}
              {isActive && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute inset-0 bg-[#202A29]"
                  transition={{
                    type: "spring",
                    stiffness: 380,
                    damping: 30,
                  }}
                />
              )}
            </Link>
          );
        })}
      </TabsList>
    </div>
  );
}
