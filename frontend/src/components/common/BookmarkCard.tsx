"use client";

import type React from "react";

import { useState } from "react";
import type { Bookmark } from "@/types/bookmark";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookmarkIcon } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import NotePopup from "@/app/components/home/NotePopup";

import BookMarkSettingIcon from "./BookMarkSettingIcon";
import { BookmarkDetailModal } from "@/app/components/bookmark/BookmarkModal";
import { VisitButton } from "./VisitButton";

interface NoteButtonProps {
  handleNotePopoverClick: (e: React.MouseEvent) => void;
  editNotes: boolean;
  setEditNotes: (editNotes: boolean) => void;
  noteContent: string;
  setNoteContent: (noteContent: string) => void;
  bookmark: Bookmark;
  saveNoteToBackend: (bookmarkId: string, content: string) => Promise<boolean>;
}

interface BookmarkCardProps {
  bookmark: Bookmark;
}

export default function BookmarkCard({ bookmark }: BookmarkCardProps) {
  const [saved, setSaved] = useState<boolean>(true);
  const [showNotes, setShowNotes] = useState<boolean>(false);
  const [noteContent, setNoteContent] = useState<string>(() =>
    bookmark.notes?.length > 0 ? bookmark.notes : "",
  );
  const [editNotes, setEditNotes] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  console.log("bookmark data: ", bookmark);

  const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("token="))
    ?.split("=")[1];

  const showNotesFunc = () => {
    console.log(!showNotes);
    setShowNotes(!showNotes);
  };

  async function saveNoteToBackend(bookmarkId: string, content: string) {
    const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/content/update/notes`;
    console.log("api url", apiUrl);
    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          notes: content,
          bookmarkID: bookmarkId,
        }),
      });
      const data = await response.json();
      console.log("data: ", data);
      return true;
    } catch (error) {
      console.error("Failed to save note:", error);
      return false;
    }
  }

  const tabBookmark = async () => {
    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/content/tab`;
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content_id: bookmark.content_id,
        }),
      });
      if (!response.ok) {
        const errorBody = await response.text();
        console.error("Error response body:", errorBody);
        toast.error("Login failed. Please check your credentials.");
        return;
      }
      const data = await response.json();
      toast.message("Tab saved");
    } catch (error) {
      console.log("Error: ", error);
      toast.error("Error tabing your content");
    }
  };

  const toggleSaved = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent modal from opening
    setSaved(!saved);
    console.log(saved);
    if (!saved) {
      tabBookmark();
      return;
    }
    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/content/untab`;
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content_id: bookmark.content_id,
        }),
      });
      if (!response.ok) {
        const errorBody = await response.text();
        console.error("Error response body:", errorBody);
        toast.error("Login failed. Please check your credentials.");
        return;
      }
      const data = await response.json();
      toast.message("Tab removed");
    } catch (error) {
      console.log("Error: ", error);
      toast.error("Error untabing your tab");
    }
  };

  const setReadLink = async () => {
    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/content/read/${bookmark.content_id}`;
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      console.log(data);
    } catch (error) {
      console.log(error);
    }
  };

  const handleNotePopoverClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent modal from opening when clicking notes
  };

  return (
    <>
      <div
        onClick={() => setIsModalOpen(true)}
        className="border border-black rounded-lg p-6 wrap-break-word hover:shadow-md transition-shadow flex flex-col justify-between h-full cursor-pointer"
      >
        {/* Top metadata row */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            {bookmark.url ? (
              <img
                src={`https://www.google.com/s2/favicons?domain=${bookmark.url}&sz=32`}
                alt="favicon"
                width={20}
                height={20}
                className="rounded-sm"
              />
            ) : (
              <div className="w-5 h-5 bg-gray-100 rounded-sm flex items-center justify-center text-xs text-gray-500">
                ?
              </div>
            )}
            <span className="text-sm text-gray-600 truncate max-w-[180px]">
              {new URL(bookmark.url).hostname}
            </span>
          </div>
          <div className="flex items-center text-xs text-gray-800">
            {formatDate(bookmark.first_saved_at)}
            <div onClick={(e) => e.stopPropagation()}>
              <BookMarkSettingIcon
                content_id={bookmark.content_id}
                url={bookmark.url}
                archiveUrlProp={bookmark.html_url ? bookmark.html_url : ""}
                folder_bookmark={false}
              />
            </div>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-bold text-lg mb-2">
          {bookmark.title || "Untitled"}
        </h3>

        {/* AI Summary */}
        <p className="text-gray-700 mb-4 line-clamp-3">
          {bookmark.ai_summary || "No summary available."}
        </p>

        {/* categories */}
        {bookmark?.categories?.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {bookmark.categories.map((cat) => (
              <Badge
                key={cat.category_id}
                variant="secondary"
                className="text-xs bg-gray-500"
              >
                {cat.category_name}
              </Badge>
            ))}
          </div>
        )}

        <div className="relative mt-4">
          {showNotes && <NotePopup note={bookmark.notes} />}

          {/* Footer */}
          <div className="flex justify-between items-center mt-auto pt-1 ">
            <VisitButton
              url={bookmark.url}
              contentId={bookmark.content_id}
              onVisit={setReadLink}
            />
            <Button
              variant="ghost"
              size="icon"
              className="text-[#202A29]"
              onClick={toggleSaved}
            >
              <BookmarkIcon
                className="h-4 w-4 text-[#202A29]"
                fill={saved ? "currentColor" : "none"}
              />
            </Button>
          </div>
        </div>
      </div>

      <BookmarkDetailModal
        bookmark={bookmark}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
