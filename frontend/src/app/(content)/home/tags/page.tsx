"use client";
import { act, useEffect, useState } from "react";
import TagsLayout from "./TagsLayout";
import { fetchToken } from "@/functions/user/UserData";
import { CheckCircle2 } from "lucide-react"; // Optional: for a visual checkmark

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import TagSelectionTab from "@/components/tag/TagSelectionTab";

interface Tag {
  tag_id: string;
  tag_name: string;
  first_created_at?: string;
}

interface TagCreationData {
  tag_name: string;
}

function Page() {
  const [open, setOpen] = useState<boolean>(false);
  const [usersTags, setUsersTags] = useState<Tag[]>([]);
  const [isBulkEdit, setIsBulkEdit] = useState<boolean>(false);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [selectecdAction, setSelectedAction] = useState<string>("");
  const [tagData, setTagData] = useState<TagCreationData>({
    tag_name: "",
  });

  const toggleTagSelection = (tagId: string) => {
    if (!isBulkEdit) return;

    setSelectedTags((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(tagId)) {
        newSet.delete(tagId);
      } else {
        newSet.add(tagId);
      }
      return newSet;
    });
  };

  const handleSelectedAction = async (action: string) => {
    console.log("launched action, action is ", action);
    try {
      if (selectedTags.size === 0) {
        alert("No tags selected!");
        return;
      }

      if (action === "remove") {
        const token = fetchToken();
        const tagIds = Array.from(selectedTags);

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/tag`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ tag_ids: tagIds }),
        });

        const data = await res.json();
        console.log("returned data: ", data);

        if (data.status === "success") {
          setUsersTags((prev) =>
            prev.filter((tag) => !selectedTags.has(tag.tag_id)),
          );
          setSelectedTags(new Set());
          setIsBulkEdit(false);
        }
      }
    } catch (err) {
      console.error("Failed to handle selected action:", err);
    } finally {
      setSelectedAction("");
    }
  };

  const handleBulkEdit = (editType: string) => {
    if (editType === "cancel-edit") {
      setIsBulkEdit(false);
      setSelectedTags(new Set()); // Clear selection on cancel
    } else {
      setIsBulkEdit(true);
    }
  };

  // --- Your original updateTagName function ---
  const updateTagName = (value: string) => {
    setTagData({
      ...tagData,
      tag_name: value,
    });
  };

  const createTag = async () => {
    const token = fetchToken();
    const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/tag`;

    const body_payload = JSON.stringify(tagData);

    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: body_payload,
    });

    const data = await res.json();

    console.log("data being returned: ", data);

    if (res.ok) {
      // Refresh the list or add the new tag to state
      const resTagData = data.newTag;
      const newTagInput = {
        tag_id: resTagData.tag_id,
        tag_name: tagData.tag_name,
      };
      setUsersTags((prev) => [...prev, newTagInput]);
      setTagData({ tag_name: "" });
      setOpen(false);
    }
  };

  useEffect(() => {
    const getUserTags = async () => {
      const token = fetchToken();
      const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/tag`;
      const res = await fetch(apiUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setUsersTags(data);
    };
    getUserTags();
  }, []);

  return (
    <TagsLayout>
      <div className="min-h-screen p-8 text-gray-900 font-sans">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
          <div>
            <h1 className="text-2xl font-bold tracking-tight uppercase">
              Your Tags ({usersTags.length})
            </h1>
            <div className="h-1 w-12 bg-gray-900 mt-1"></div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() =>
                handleBulkEdit(isBulkEdit ? "cancel-edit" : "edit")
              }
              className="rounded-md border border-gray-400 bg-gray-300 px-4 py-1.5 text-sm font-medium hover:bg-gray-400 transition-colors"
            >
              {isBulkEdit ? "Cancel" : "Bulk Edit"}
            </button>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <button className="rounded-md bg-gray-900 px-4 py-1.5 text-sm font-medium text-gray-100 hover:bg-gray-800 transition-colors cursor-pointer">
                  Create Tag
                </button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                sideOffset={20}
                className="w-96 bg-gray-100"
              >
                <div className="flex flex-1 flex-col text-white space-y-4 p-1">
                  <h1 className="text-white font-semibold text-lg">Tag Name</h1>
                  <input
                    id="folder-name-input"
                    placeholder=""
                    className="border border-black focus:border-gray-300 focus:outline-none text-black px-3 py-2 rounded-md"
                    value={tagData.tag_name}
                    onChange={(e) => updateTagName(e.target.value)}
                  />
                  <div className="flex items-end w-full justify-end space-x-3 text-black">
                    <button
                      className="rounded-lg hover:bg-amber-50 px-3 py-1.5 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
                      onClick={() => setOpen(!open)}
                    >
                      Cancel
                    </button>
                    <button
                      className="rounded-lg px-3 py-1.5 bg-gray-800 text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                      onClick={createTag}
                    >
                      Create
                    </button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            {/* ... Popover for Create Tag remains the same */}
          </div>
        </div>

        {isBulkEdit && (
          <TagSelectionTab
            setSelectedAction={setSelectedAction}
            handleSelectedAction={handleSelectedAction}
            selectedAction={selectecdAction}
          />
        )}

        {/* Tags Display */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-1">
          {usersTags.map((tag, index) => {
            const isSelected = selectedTags.has(tag.tag_id);

            return (
              <div
                key={index}
                onClick={() => toggleTagSelection(tag.tag_id)}
                className={`
          relative p-6 flex items-center rounded-lg justify-between group transition-all
          bg-gray-300 hover:bg-gray-200 
          ${isBulkEdit ? "cursor-pointer" : "cursor-default"}
          ${isSelected ? "ring-2 ring-gray-900 shadow-sm" : "ring-0"}
        `}
              >
                {/* The Checkbox - only visible during Bulk Edit */}
                {isBulkEdit && (
                  <input
                    type="checkbox"
                    checked={isSelected}
                    readOnly
                    className="absolute bg-amber-100 top-2 right-2 w-4 h-4 accent-gray-900 cursor-pointer"
                  />
                )}

                <span className="text-sm font-bold uppercase tracking-widest">
                  {tag.tag_name}
                </span>

                {/* Edit label - hidden during Bulk Edit to keep UI clean */}
                {!isBulkEdit && (
                  <span className="opacity-0 group-hover:opacity-100 text-[10px] cursor-pointer text-gray-500 font-mono tracking-tighter">
                    EDIT
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </TagsLayout>
  );
}

export default Page;
