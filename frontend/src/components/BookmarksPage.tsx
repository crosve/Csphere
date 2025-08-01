"use client";

import { useEffect, useState } from "react";
import BookmarkList from "./BookmarkList";
import { Suspense } from "react";
import BookmarkLayout from "@/app/(content)/home/BookmarkLayout";

import Loading from "./ux/Loading";
type ChildProps = {
  activeTab?: string;
};

const BookmarksPage: React.FC<ChildProps> = ({ activeTab }) => {
  const [bookmarks, setBookmarks] = useState([]);
  console.log("current active tab: ", activeTab);

  const fetchBookmarks = async (query = "") => {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1];

    if (!token) return;

    try {
      const url = query.trim()
        ? `${
            process.env.NEXT_PUBLIC_API_BASE_URL
          }/content/search?query=${encodeURIComponent(query)}`
        : `${process.env.NEXT_PUBLIC_API_BASE_URL}/content`;

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch content");

      const data = await res.json();
      console.log("bookmark data being returned: ", data);
      setBookmarks(data);
    } catch (err) {
      console.error("Error fetching bookmarks:", err);
    }
  };

  useEffect(() => {
    fetchBookmarks(); // calls /content on initial load
  }, []);

  return (
    <BookmarkLayout onSearch={fetchBookmarks}>
      <Suspense fallback={<Loading />}>
        <BookmarkList items={bookmarks} />
      </Suspense>{" "}
    </BookmarkLayout>
  );
};

export default BookmarksPage;
