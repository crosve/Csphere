import { fetchToken } from "@/functions/user/UserData";
import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AddBookmarkPopover() {
  const [open, setOpen] = useState(false);
  const [link, setLink] = useState("");

  const handleCreate = async () => {
    try {
      const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/content/save/url`;
      const token = fetchToken();
      const res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        method: "POST",
        body: JSON.stringify({ url: link }),
      });
      const data = await res.json();
      toast.success("bookmark saved");
      console.log(data);
    } catch (err) {
      console.log("Error occurred in saving url: ", err);
      toast.error("Something went wrong, please try again");
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button className="bg-[#202A29] hover:bg-[#435856] text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors">
          Add
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={20}
        // alignOffset={20}
        className="w-96 bg-gray-100"
      >
        <div className="flex flex-1 flex-col text-white space-y-4 p-1">
          <h1 className="text-white font-semibold text-lg">URL</h1>
          <input
            id="folder-name-input"
            placeholder="https://"
            className="border border-black focus:border-gray-300 focus:outline-none text-black px-3 py-2 rounded-md"
            value={link}
            onChange={(e) => setLink(e.target.value)}
          />
          <div className="flex items-end w-full justify-end space-x-3 text-black">
            <button
              className="rounded-lg hover:bg-amber-50 px-3 py-1.5 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
              onClick={() => setOpen(!open)}
            >
              Cancel
            </button>
            <button
              className="rounded-lg px-3 py-1.5 bg-[#202A29] text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
              onClick={handleCreate}
            >
              Create
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
