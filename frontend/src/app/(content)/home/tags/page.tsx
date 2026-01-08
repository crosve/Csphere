"use client";
import { useEffect, useState } from "react";
import TagsLayout from "./TagsLayout";
import { fetchToken } from "@/functions/user/UserData";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface TagCreationData {
  tag_name: string;
}

function Page() {
  const [open, setOpen] = useState<boolean>(false);
  const [usersTags, setUsersTags] = useState([]);
  const [tagData, setTagData] = useState<TagCreationData>({
    tag_name: "",
  });

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

    console.log("Body payload: ", body_payload);

    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: body_payload,
    });

    const data = await res.json();
    console.log("creation response: ", data);
  };
  useEffect(() => {
    const getUserTags = async () => {
      const token = fetchToken();

      const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/tag`;

      const res = await fetch(apiUrl, {
        method: "GET",
        headers: {
          // 'Content-Type': 'application/json', // Inform the server about the content type
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      setUsersTags(data);

      console.log("response data: ", data);
    };

    getUserTags();
  }, []);
  return (
    <TagsLayout>
      <div className="min-h-screen p-8 text-gray-900 font-sans">
        {/* Top Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
          <div>
            <h1 className="text-2xl font-bold tracking-tight uppercase ">
              Your Tags ({usersTags.length})
            </h1>
            <div className="h-1 w-12 bg-gray-900 mt-1"></div>{" "}
            {/* Minimalist accent line */}
          </div>

          <div className="flex items-center space-x-2">
            <button className="rounded-md border border-gray-400 bg-gray-300 px-4 py-1.5 text-sm font-medium hover:bg-gray-400 transition-colors cursor-pointer">
              Bulk Edit
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
          </div>
        </div>

        {/* Search / Filter Row (Optional but keeps it functional) */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="Filter tags..."
            className="w-full max-w-xs bg-gray-300 border-b-2 border-gray-400 p-1 focus:outline-none focus:border-gray-900 placeholder-gray-500 text-sm"
          />
        </div>

        {/* Tags Display */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-px p-1 space-x-1.5 space-y-1  ">
          {usersTags.map((tag, index) => (
            <div
              key={index}
              className="bg-gray-300 p-6 flex items-center rounded-lg justify-between group hover:bg-gray-200 transition-all cursor-default"
            >
              <span className="text-sm font-bold uppercase tracking-widest">
                {tag.tag_name}
              </span>
              <span className="opacity-0 group-hover:opacity-100 text-[10px] cursor-pointer text-gray-500 font-mono tracking-tighter">
                EDIT
              </span>
            </div>
          ))}
        </div>
      </div>
    </TagsLayout>
  );
}

export default Page;
