import { Button } from "@/components/ui/button";
import type { Dispatch, SetStateAction } from "react";
import { cn } from "@/lib/utils";

const selectionItems = ["remove"];
interface TagSelectionProps {
  setSelectedAction: Dispatch<SetStateAction<string>>;
  handleSelectedAction: (action: string) => void;
  selectedAction: string;
}

function TagSelectionTab({
  setSelectedAction,
  handleSelectedAction,
  selectedAction,
}: TagSelectionProps) {
  return (
    <div
      className={cn(
        "w-full flex flex-row space-x-6 items-start h-auto p-2 rounded-2xl bg-gray-300 shadow-sm mb-4",
      )}
    >
      {selectionItems.map((item, index) => {
        return (
          <Button
            key={index}
            onClick={() => {
              setSelectedAction(item);
              handleSelectedAction(item);
            }}
            className={cn(
              "hover:bg-gray-200",
              selectedAction == item && "bg-gray-400",
            )}
          >
            {item}
          </Button>
        );
      })}
    </div>
  );
}

export default TagSelectionTab;
