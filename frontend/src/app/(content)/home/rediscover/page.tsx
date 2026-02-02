"use client";
import { useState, useEffect } from "react";
import RediscoverLayout from "./RediscoverLayout";

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

import BookmarkList from "@/components/BookmarkList";
function page() {
  const fetchRediscoverContent = () => {};
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

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

      console.log("current res data: ", res);

      const data = await res.json();
      console.log("data: ", data);

      setBookmarks(data);
    };

    fetchContent();
  }, []);

  return (
    <RediscoverLayout>
      <BookmarkList items={bookmarks}></BookmarkList>
    </RediscoverLayout>
  );
}

export default page;
