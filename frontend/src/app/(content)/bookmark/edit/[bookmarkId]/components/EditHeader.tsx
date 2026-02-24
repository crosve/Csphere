import { useCallback, useState } from "react";
import { BsArrowsFullscreen } from "react-icons/bs";
import { HiDownload } from "react-icons/hi";
import { IconType } from "react-icons";
import { SimpleEditorRef } from "@/components/tiptap-templates/simple/simple-editor";
import { DownloadOptions } from "./DownloadOptions";
import { useRouter } from "next/navigation";

interface TopButtonsType {
  title: string;
  function: () => void;
  icon?: IconType;
}

interface EditHeaderProps {
  editorRef: React.RefObject<SimpleEditorRef>;
  pageTitle: string;
}

function EditHeader({ editorRef, pageTitle }: EditHeaderProps) {
  const [showDownloadOptions, setShowDownloadOptions] =
    useState<boolean>(false);

  const router = useRouter();

  const topButtons: TopButtonsType[] = [
    {
      title: "Fullscreen",
      function: () => {
        const splitContainer = document.getElementById("split-container");
        if (splitContainer?.requestFullscreen) {
          splitContainer.requestFullscreen();
        }
      },
      icon: BsArrowsFullscreen,
    },
    {
      title: "Download",
      function: () => setShowDownloadOptions(true),
      icon: HiDownload,
    },
  ];

  const handleBackNavigation = () => {
    router.back();
  };

  return (
    <>
      <div className="w-full bg-white border-b border-gray-100 h-12 flex items-center gap-2 px-3">
        <button
          onClick={(e) => {
            e.stopPropagation();

            handleBackNavigation();
          }}
          className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all duration-150 px-3 py-1.5 rounded-lg mr-auto"
        >
          Back
        </button>
        {topButtons.map((button) => (
          <button
            key={button.title}
            onClick={button.function}
            title={button.title}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all duration-150 px-3 py-1.5 rounded-lg"
          >
            {button.icon && <button.icon className="w-3.5 h-3.5" />}
            <span>{button.title}</span>
          </button>
        ))}
      </div>

      {showDownloadOptions && (
        <DownloadOptions
          editorRef={editorRef}
          pageTitle={pageTitle}
          setShowDownloadOptions={setShowDownloadOptions}
        />
      )}
    </>
  );
}

export default EditHeader;
