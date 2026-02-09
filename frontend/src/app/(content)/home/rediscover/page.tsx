"use client";
import { useState, useEffect } from "react";
// import RediscoverLayout from "./RediscoverLayout";
import BookmarkList from "@/components/common/BookmarkList";

import { fetchToken } from "@/functions/user/UserData";

interface Tag {
  tag_id: string;
  tag_name: string;
}

interface Category {
  category_id: string;
  category_name: string;
}

type Bookmark = {
  content_id: string;
  title?: string;
  source?: string;
  ai_summary?: string;
  url: string;
  tags?: Tag[];
  categories?: Category[];
};

type MonthBookmarkData = Record<string, Bookmark[]>;

function page() {
  const fetchRediscoverContent = () => {};
  const [monthBookmarks, setMonthBookmarks] = useState<MonthBookmarkData>({});
  useEffect(() => {
    const fetchContent = async () => {
      const token = fetchToken();
      console.log("current token: ", token);
      const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/content/rediscover`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        method: "GET",
      });

      const data = await res.json();
      console.log("month bookmak data: ", data);

      setMonthBookmarks(data);
    };

    fetchContent();
  }, []);

  return (
    <>
      {Object.entries(monthBookmarks).map(([month, bookmarks]) => (
        // Use a Fragment or a div with a key when mapping
        <div key={month} className="mb-10">
          <h2 className="text-lg font-semibold">{month}</h2>
          <BookmarkList items={bookmarks} />
        </div>
      ))}
    </>
  );
}

export default page;
