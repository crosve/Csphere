"use client";

import { useEffect, useState, useRef } from "react";
import BookmarkList from "./BookmarkList";
import { Suspense } from "react";
import BookmarkLayout from "@/app/(content)/home/layout";
import CategoryFilter from "./CategoryFilter";
import Loading from "../ux/Loading";
import { list } from "postcss";
import { Bookmark } from "@/types/bookmark";
import SearchInput from "./SearchInput";
type ChildProps = {
  activeTab?: string;
};

interface Tags {
  category_id: string;
  category_name: string;
}

const BookmarksPage: React.FC<ChildProps> = ({ activeTab }) => {
  //Make a type for the bookmarks later
  const [originalBookmarks, setOriginalBookmarks] = useState([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  const [categories, setCategories] = useState<Tags[]>([]);
  const [choosenCategories, setChoosenCategories] = useState<string[]>([]);

  //Use ref to not cause stale fucntions
  const cursor = useRef<string>("");

  const nextBatchLoading = useRef<boolean>(false);

  const hasNext = useRef<boolean>(true);

  const loadNextBatch = async (query = "") => {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1];

    try {
      let contentApi = `${process.env.NEXT_PUBLIC_API_BASE_URL}/content`;
      console.log("here right now", cursor);
      if (cursor.current !== "") {
        console.log("adding current cursor: ", cursor.current);
        contentApi += `?cursor=${encodeURIComponent(cursor.current)}`;
      }

      if (choosenCategories.length > 0) {
        const categoryString = choosenCategories.join(",");
        contentApi +=
          (contentApi.includes("?") ? "&" : "?") +
          `categories=${categoryString}`;
      }
      console.log("fetching at this api endpoint: ", contentApi);
      const url = query.trim()
        ? `${
            process.env.NEXT_PUBLIC_API_BASE_URL
          }/content/search?query=${encodeURIComponent(query)}`
        : contentApi;

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch content");

      const data = await res.json();

      console.log("data being returned: ", data);
      setOriginalBookmarks((prev) => [...prev, ...data.bookmarks]);

      setBookmarks((prev) => [...prev, ...data.bookmarks]);
      setCategories((prev) => {
        const incoming = (data.categories || []).filter(
          (c: Tags) => c?.category_name?.trim() !== "",
        );
        const byId = new Map(prev.map((c) => [c.category_id, c]));
        for (const c of incoming) byId.set(c.category_id, c);
        const merged = Array.from(byId.values());
        console.log("new merged categories: ", merged);
        return merged;
      });
      hasNext.current = data.has_next;

      if (data.has_next) {
        cursor.current = data.next_cursor;
      }
    } catch (err) {
      console.error("Error fetching bookmarks:", err);
    }
  };

  const handleScroll = () => {
    const scrollTop = window.scrollY;
    const windowHeight = window.innerHeight;
    const fullHeight = document.documentElement.scrollHeight;

    if (
      scrollTop + windowHeight >= fullHeight - 250 &&
      hasNext.current &&
      !nextBatchLoading.current
    ) {
      console.log("loading new batch", cursor);
      nextBatchLoading.current = true;
      loadNextBatch().finally(() => (nextBatchLoading.current = false));
    }
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const fetchBookmarks = async (query = "") => {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1];

    if (!token) return;

    try {
      let contentApi = `${process.env.NEXT_PUBLIC_API_BASE_URL}/content`;
      if (cursor.current !== "") {
        contentApi += "?cursor=" + encodeURIComponent(cursor.current);
      }

      if (choosenCategories.length > 0) {
        const categoryString = choosenCategories.join(",");
        contentApi +=
          (contentApi.includes("?") ? "&" : "?") +
          `categories=${categoryString}`;
      }

      const url = query.trim()
        ? `${
            process.env.NEXT_PUBLIC_API_BASE_URL
          }/content/search?query=${encodeURIComponent(query)}`
        : contentApi;

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch content");

      const data = await res.json();
      console.log("all data: ", data);
      setOriginalBookmarks(data.bookmarks);
      setBookmarks(data.bookmarks);
      setCategories(data.categories);
      hasNext.current = data.has_next;
      cursor.current = data.next_cursor;
    } catch (err) {
      console.error("Error fetching bookmarks:", err);
    }
  };

  useEffect(() => {
    fetchBookmarks(); // calls /content on initial load
  }, []);

  useEffect(() => {
    const filterBookmarks = () => {
      const chosenCategorySet = new Set(choosenCategories);

      if (chosenCategorySet.size === 0) {
        setBookmarks(originalBookmarks);
        return;
      }

      const filtered = originalBookmarks.filter((bookmark: Bookmark) => {
        const bookmarkNames = bookmark.categories.map(
          (cat) => cat.category_name,
        );
        const categorySet = new Set(bookmarkNames);

        // If `.intersection()` exists:
        const intersection = categorySet.intersection(chosenCategorySet);
        return intersection.size > 0;
      });

      setBookmarks(filtered);
    };
    filterBookmarks();
  }, [choosenCategories]);

  return (
    <>
      {/* <SearchInput onSearch={onSearch} /> */}
      <CategoryFilter
        choosenCategories={choosenCategories}
        categories={categories}
        setChoosenCategories={setChoosenCategories}
      />
      <Suspense fallback={<Loading />}>
        <BookmarkList items={bookmarks} isFolder={false} />
      </Suspense>{" "}
      {!hasNext.current && (
        <h1 className="text-center">
          You've reached the end of your bookmarks!{" "}
        </h1>
      )}
    </>
  );
};

export default BookmarksPage;
