"use client";

import { useState, useEffect, use, useCallback, useRef } from "react";
import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor";
import { fetchToken } from "@/functions/user/UserData";
import { SplitPane } from "./components/SplitPlane";

import { SimpleEditorRef } from "@/components/tiptap-templates/simple/simple-editor";

import { ExplanationPopup } from "./components/ExplanationPopup";
import EditHeader from "./components/EditHeader";

function page({ params }: { params: Promise<{ bookmarkId: string }> }) {
  const [isIframeLoading, setIsIframeLoading] = useState<boolean>(true);
  const [archiveUrl, setArchiveUrl] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "failed to save"
  >("idle");
  const [pageTitle, setPageTitle] = useState<string>("Untitled");
  const [editorNoteContent, setEditorNoteContent] = useState("");
  const [selectedText, setSelectedText] = useState<string>("");
  const [showPopover, setShowPopover] = useState<boolean>(false);
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });

  const [aiExplnation, setAiExplanation] = useState<string>("");
  const [isAiModelOpen, setIsAiModelOpen] = useState<boolean>(false);

  const editorRef = useRef<SimpleEditorRef>(null);

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
      if (data.title) setPageTitle(data.title);

      const preSignedUrl = data.url;
      console.log("presigned url: ", preSignedUrl);
      setArchiveUrl(
        `/api/archive/${bookmarkId}?url=${encodeURIComponent(preSignedUrl)}`,
      );
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
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/content/edit/notes/${bookmarkId}`,
      {
        method: "POST",
        body: JSON.stringify({ contentJsonString: content }),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const data = await res.json();
    if (data.success === true) {
      setSaveStatus("saved");
    } else {
      setSaveStatus("failed to save");
    }
    setTimeout(() => setSaveStatus("idle"), 2000);
  };

  const handleIframeSelection = useCallback(() => {
    const iframe = document.querySelector("iframe");
    if (!iframe?.contentWindow) return;

    const selection = iframe.contentWindow.getSelection();
    if (!selection || selection.isCollapsed) return;

    const text = selection.toString().trim();
    if (!text) return;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const iframeRect = iframe.getBoundingClientRect();

    setSelectedText(text);
    setPopoverPosition({
      x: rect.left - iframeRect.left + rect.width / 2,
      y: rect.top - iframeRect.top + 80,
    });
    setShowPopover(true);
  }, []);

  const handleIframeLoad = useCallback(() => {
    setIsIframeLoading(false);
    const iframe = document.querySelector("iframe");
    console.log("contentDocument:", iframe?.contentDocument);
    iframe?.contentDocument?.addEventListener("mouseup", handleIframeSelection);
  }, [handleIframeSelection]);

  useEffect(() => {
    const handleClickOutside = () => setShowPopover(false);
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAiExplain = async (textSelected: string) => {
    try {
      const token = fetchToken();

      const API = `${process.env.NEXT_PUBLIC_API_BASE_URL}/content/ai/queryText=${encodeURIComponent(textSelected)}`;

      const response = await fetch(API, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setAiExplanation(data.response);
      }

      console.log("data for explanation: ", data);
    } catch (error) {
      console.log("Failed to get ai explanation: ", error);
    }
  };

  const handleAiModelClose = () => {
    setIsAiModelOpen(false);
    setAiExplanation("");
  };

  return (
    <div className="w-full h-full p-4 bg-gray-300 space-y-4">
      <EditHeader editorRef={editorRef} pageTitle={pageTitle} />
      {/* <script
        async
        src="https://cse.google.com/cse.js?cx=b56d8ea42869a40ba"
      ></script>
      <div className="gcse-search"></div> */}

      {isAiModelOpen === true && (
        <ExplanationPopup
          editorRef={editorRef}
          explanation={aiExplnation}
          isExplaining={true}
          onClose={handleAiModelClose}
        />
      )}
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
                sandbox="allow-same-origin allow-scripts"
                title="Content Archive"
                onLoad={handleIframeLoad}
              />

              {showPopover && (
                <div
                  className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-1 flex gap-1"
                  style={{ top: popoverPosition.y, left: popoverPosition.x }}
                >
                  <button
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={() => {
                      //Add to the notes
                      editorRef.current?.insertQuote(selectedText);
                      setShowPopover(false);

                      setSelectedText("");
                    }}
                    className="text-xs px-2 py-1 hover:bg-gray-100 rounded"
                  >
                    Add to notes
                  </button>
                  <button
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={() => {
                      console.log("Explain:", selectedText);

                      handleAiExplain(selectedText);
                      setIsAiModelOpen(true);

                      setShowPopover(false);

                      setSelectedText("");
                    }}
                    className="text-xs px-2 py-1 hover:bg-blue-50 text-blue-600 rounded"
                  >
                    AI Explaination
                  </button>
                </div>
              )}
            </div>
          </div>
        }
        right={
          <div className="flex flex-col h-full border-l bg-white border-gray-200">
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50 flex-shrink-0">
              <span className="text-sm font-medium text-gray-700">Notes</span>
              <span
                className={`text-xs transition-opacity duration-300 ${
                  saveStatus === "idle" ? "opacity-0" : "opacity-100"
                } ${
                  saveStatus === "saving"
                    ? "text-black"
                    : saveStatus === "saved"
                      ? "text-green-500"
                      : "text-red-500"
                }`}
              >
                {saveStatus}
              </span>
            </div>

            {/* Editor */}
            <div className="flex-1 overflow-hidden">
              <SimpleEditor
                ref={editorRef}
                onSave={handleSave}
                editContent={editorNoteContent}
              />
            </div>
          </div>
        }
      />
    </div>
  );
}

export default page;
