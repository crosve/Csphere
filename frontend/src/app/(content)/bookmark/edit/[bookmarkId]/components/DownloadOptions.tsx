import React from "react";
import { HiOutlineDocumentText } from "react-icons/hi";
import { BsFilePdf } from "react-icons/bs";
import { SimpleEditorRef } from "@/components/tiptap-templates/simple/simple-editor";

interface DownloadOptionsProps {
  editorRef: React.RefObject<SimpleEditorRef>;
  pageTitle: string;
  setShowDownloadOptions: React.Dispatch<React.SetStateAction<boolean>>;
}

export const DownloadOptions = ({
  editorRef,
  pageTitle,
  setShowDownloadOptions,
}: DownloadOptionsProps) => {
  const options = [
    {
      optionName: "Plain Text",
      description: "Download as .txt file",
      icon: HiOutlineDocumentText,
      function: () => {
        editorRef.current?.downloadNotes(pageTitle);
        setShowDownloadOptions(false);
      },
    },
    {
      optionName: "PDF",
      description: "Download as .pdf file",
      icon: BsFilePdf,
      function: () => {
        editorRef.current?.downloadPDF(pageTitle);
        setShowDownloadOptions(false);
      },
    },
  ];

  return (
    <div
      className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center backdrop-blur-sm"
      onClick={() => setShowDownloadOptions(false)}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-80 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <span className="text-sm font-semibold text-gray-800">
            Download Notes
          </span>
          <button
            onClick={() => setShowDownloadOptions(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>

        {/* Options */}
        <div className="p-3 flex flex-col gap-2">
          {options.map((option) => (
            <button
              key={option.optionName}
              onClick={option.function}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-left group"
            >
              <div className="w-9 h-9 rounded-lg bg-gray-100 group-hover:bg-gray-200 transition-colors flex items-center justify-center flex-shrink-0">
                <option.icon className="w-4 h-4 text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">
                  {option.optionName}
                </p>
                <p className="text-xs text-gray-400">{option.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
