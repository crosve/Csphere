import BookmarkCard from "./BookmarkCard";

import { useContext } from "react";
import { LayoutContext } from "@/app/(content)/home/BookmarkLayout";
import FolderBookmarkCard from "./folder/FolderBookmarkCard";

interface Tag {
  tag_id: string;
  tag_name: string;
}

interface Category {
  category_id: string;
  category_name: string;
}

type Bookmark = {
  content_id: string;
  title?: string;
  source?: string;
  ai_summary?: string;
  url: string;
  tags?: Tag[];
  categories?: Category[];
};

export default function BookmarkList({
  items,
  isFolder = false,
  selectionMode,
  selectedBookmarks,
  onToggleSelect,
}: {
  items: Bookmark[];
  isFolder?: boolean;
  selectionMode?: boolean;
  selectedBookmarks?: Set<string>;
  onToggleSelect?: (id: string) => void;
}) {
  const viewMode = useContext(LayoutContext);

  console.log("all items: ", items);
  if (items.length === 0) {
    return <p className="text-center text-gray-500">No bookmarks found</p>;
  }

  return (
    <div
      className={`grid gap-6 ${
        viewMode === "grid"
          ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          : "grid-cols-1"
      }`}
    >
      {isFolder === true
        ? items.map((item) => {
            const selected = selectedBookmarks.has(item.content_id);
            return (
              <FolderBookmarkCard
                key={item.content_id}
                bookmark={item}
                selectable={selectionMode}
                selected={selected}
                onSelect={() => onToggleSelect(item.content_id)}
              />
            );
          })
        : items.map((item) => (
            <BookmarkCard key={item.content_id} bookmark={item} />
          ))}
    </div>
  );
}
