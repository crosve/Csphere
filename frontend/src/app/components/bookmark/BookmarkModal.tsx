"use client";

import { useState } from "react";
import {
  ExternalLink,
  Copy,
  Calendar,
  Tag,
  FileText,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {VisitButton} from "../../../components/VisitButton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Tag {
  category_id: string;
  category_name: string;
}

interface BookmarkData {
  content_id: string;
  title?: string;
  url: string;
  source?: string;
  ai_summary?: string;
  first_saved_at?: string; // ISO timestamp, might also be Date if parsed
  tags?: Tag[];
  notes?: string;
}

interface BookmarkDetailModalProps {
  bookmark: BookmarkData | null;
  isOpen: boolean;
  onClose: () => void;
}

const tags = ["rag", "llm", "mcp"];

export function BookmarkDetailModal({
  bookmark,
  isOpen,
  onClose,
}: BookmarkDetailModalProps) {
  const [copiedUrl, setCopiedUrl] = useState(false);

  if (!bookmark) return null;

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(bookmark.url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("token="))
    ?.split("=")[1];

  const setReadLink = async () => {
    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/content/${bookmark.content_id}`;
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[1000px] sm:max-w-none max-h-[100vh] bg-gray-300 p-2 flex flex-col wrap-break-word pl-6 pr-6">
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-start gap-4">
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
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl font-semibold leading-tight mb-2">
                {bookmark.title}
              </DialogTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="truncate">{bookmark.url}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyUrl}
                  className="h-6 px-2"
                >
                  <Copy className="w-3 h-3" />
                  {copiedUrl ? "Copied!" : "Copy"}
                </Button>
              </div>
            </div>
            <div className="flex gap-2">
              <VisitButton
                url={bookmark.url}
                contentId={bookmark.content_id}
                onVisit={setReadLink}
              />
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6">
          <div className="space-y-6 pb-6">
            {/* Metadata */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>Saved {formatDate(bookmark.first_saved_at)}</span>
              </div>
            </div>

            {/* <div>
              <div className="flex items-center gap-2 mb-3">
                <Tag className="w-4 h-4" />
                <span className="font-medium">Tags</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-gray-200"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div> */}

            {/* Tags */}
            {bookmark.tags?.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="w-4 h-4" />
                  <span className="font-medium">Tags</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {bookmark.tags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="bg-gray-200"
                    >
                      {tag.category_name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Separator className="bg-gray-500" />

            {/* AI Summary */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4" />
                <span className="font-medium">AI Summary</span>
              </div>
              <div className="bg-gray-100 rounded-lg p-4">
                <p className="text-sm leading-relaxed">{bookmark.ai_summary}</p>
              </div>
            </div>

            {/* Personal Notes */}
            {bookmark.notes && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4" />
                  <span className="font-medium">Your Notes</span>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border-l-4 border-blue-500">
                  <p className="text-sm leading-relaxed">{bookmark.notes}</p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
