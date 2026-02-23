"use client";

import { useState, useEffect, use, useCallback, useRef } from "react";
import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor";
import { fetchToken } from "@/functions/user/UserData";
import { SplitPane } from "./components/SplitPlane";

function page({ params }: { params: Promise<{ bookmarkId: string }> }) {
  const [isIframeLoading, setIsIframeLoading] = useState<boolean>(true);
  const [archiveUrl, setArchiveUrl] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "failed to save"
  >("idle");

  //   const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
  //     "idle",
  //   );
  const [pageTitle, setPageTitle] = useState<string>("Untitled");

  const [editorNoteContent, setEditorNoteContent] = useState("");
  const { bookmarkId } = use(params);

  useEffect(() => {
    const fetchArchiveData = async (bookmarkId: string) => {
      const API_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/content/${bookmarkId}/archive`;
      const token = fetchToken();
      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      setArchiveUrl(data.url);
      if (data.title) setPageTitle(data.title);
    };

    const fetchPrevEditorContent = async (bookmarkId: string) => {
      const API_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/content/edit/notes/${bookmarkId}`;
      const token = fetchToken();
      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      console.log("Edit notes data: ", data);
      if (data.success === true) {
        setEditorNoteContent(data.editContent);
      }
    };

    if (bookmarkId) {
      fetchArchiveData(bookmarkId);
      fetchPrevEditorContent(bookmarkId);
    }
  }, []);

  const handleSave = async (content: string) => {
    setSaveStatus("saving");
    const token = fetchToken();
    await new Promise((resolve) => setTimeout(resolve, 0));

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/content/edit/notes/${bookmarkId}`,
      {
        method: "POST",
        body: JSON.stringify({
          contentJsonString: content,
        }),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const data = await res.json();

    console.log("Data being returned: ", data);

    if (data.sucess === true) {
      setSaveStatus("saved");
    } else {
      setSaveStatus("failed to save");
    }
    setTimeout(() => setSaveStatus("idle"), 2000);
  };

  return (
    <SplitPane
      left={
        <div className="flex flex-col h-full">
          {/* Iframe header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50 flex-shrink-0">
            <span className="text-sm font-medium text-gray-700 truncate max-w-xs">
              {pageTitle}
            </span>
            {archiveUrl && (
              <a
                href={archiveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-500 hover:text-blue-700 hover:underline flex-shrink-0 ml-2"
              >
                Open in tab ↗
              </a>
            )}
          </div>

          {/* Iframe content */}
          <div className="relative flex-1">
            {isIframeLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10">
                <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
                <p className="mt-4 text-sm text-gray-500 font-medium">
                  Restoring snapshot...
                </p>
              </div>
            )}
            <iframe
              src={archiveUrl ?? undefined}
              className={`w-full h-full border-none transition-opacity duration-300 ${
                isIframeLoading ? "opacity-0" : "opacity-100"
              }`}
              sandbox="allow-same-origin"
              title="Content Archive"
              onLoad={() => setIsIframeLoading(false)}
            />
          </div>
        </div>
      }
      right={
        <div className="flex flex-col h-full border-l border-gray-200">
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50 flex-shrink-0">
            <span className="text-sm font-medium text-gray-700">Notes</span>
            <span
              className={`text-xs transition-opacity duration-300 ${
                saveStatus === "idle" ? "opacity-0" : "opacity-100"
              } ${saveStatus === "saving" ? "text-black" : "text-green-500"}`}
            >
              {saveStatus}
            </span>
          </div>

          {/* Editor */}
          <div className="flex-1 overflow-hidden">
            <SimpleEditor onSave={handleSave} editContent={editorNoteContent} />
          </div>
        </div>
      }
    />
  );
}

export default page;
