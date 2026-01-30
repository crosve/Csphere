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
        "w-full flex flex-row space-x-3 items-start h-auto p-2 rounded-2xl bg-transparent border border-black shadow-sm mb-4",
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
              "border border-black rounded-lg px-4",
              selectedAction == item
                ? "bg-[#202A29] text-white hover:bg-[#202A29]"
                : "bg-transparent text-[#202A29] hover:bg-gray-100",
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
