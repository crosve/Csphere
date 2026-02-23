// components/ExplanationPopup.tsx
"use client";

import { useEffect, useState, useRef, forwardRef } from "react";

import ReactMarkdown from "react-markdown";
import { SimpleEditorRef } from "@/components/tiptap-templates/simple/simple-editor";

interface ExplanationPopupProps {
  explanation: string;
  isExplaining: boolean;
  onClose: () => void;
  editorRef: React.RefObject<SimpleEditorRef>; // add this
}

//({ onSave, editContent }, ref)
export function ExplanationPopup({
  explanation,
  isExplaining,
  onClose,
  editorRef,
}: ExplanationPopupProps) {
  if (!explanation && !isExplaining) return null;

  const [visibleContent, setVisibleContent] = useState<string>("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const indexRef = useRef<number>(0);

  useEffect(() => {
    setVisibleContent("");
    indexRef.current = 0;

    if (!explanation) return;

    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      if (indexRef.current >= explanation.length) {
        clearInterval(intervalRef.current!);
        return;
      }

      setVisibleContent(explanation.slice(0, indexRef.current + 1));
      indexRef.current += 5;
    }, 10);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [explanation]);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-50" onClick={onClose} />

      {/* Popup */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] max-h-[70vh] bg-white rounded-xl shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <span className="font-medium text-gray-800"> Prof Ross</span>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-5 flex-1">
          {isExplaining && !explanation && (
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:150ms]" />
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
          )}
          <div className="prose prose-sm max-w-none text-gray-700">
            <ReactMarkdown>{visibleContent}</ReactMarkdown>
          </div>
          {isExplaining && explanation && (
            <span className="inline-block w-0.5 h-4 bg-gray-800 animate-pulse ml-0.5" />
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 flex justify-end">
          <button
            className="text-sm px-4 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600"
            onClick={() => {
              console.log("adding to notes...");
              editorRef.current?.insertQuote(explanation);
              onClose();
            }}
          >
            Add to notes
          </button>
        </div>
      </div>
    </>
  );
}
