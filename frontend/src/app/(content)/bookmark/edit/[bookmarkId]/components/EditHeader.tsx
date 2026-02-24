import React from "react";
import { BsArrowsFullscreen } from "react-icons/bs";
import { IconType } from "react-icons";

import { SimpleEditorRef } from "@/components/tiptap-templates/simple/simple-editor";

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
  const topButtons: TopButtonsType[] = [
    {
      title: "full screen",
      function: () => {
        const splitContainer = document.getElementById("split-container");
        if (splitContainer.requestFullscreen) {
          console.log("going full screen");
          splitContainer.requestFullscreen();
        }
      },
      icon: BsArrowsFullscreen,
    },
    {
      title: "Download Notes",
      function: () => {
        editorRef.current?.downloadNotes(pageTitle);
      },
    },
  ];
  return (
    <div className="w-full rounded-2xl bg-gray-100 h-16 flex  flex-row-reverse items-center gap-4 justify-start p-4">
      {topButtons.map((button) => (
        <button
          key={button.title}
          onClick={() => button.function()}
          className="w-auto h-auto text-center py-2 px-4 hover:bg-gray-100 rounded-2xl bg-gray-200"
        >
          {button.icon ? <button.icon /> : <>{button.title}</>}
        </button>
      ))}
    </div>
  );
}

export default EditHeader;
