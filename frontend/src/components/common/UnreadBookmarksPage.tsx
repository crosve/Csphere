"use client";

import { useEffect, useState } from "react";
import BookmarkList from "./BookmarkList";
import CategoryFilter from "./CategoryFilter";

import SearchInput from "./SearchInput";
type ChildProps = {
  activeTab?: string;
};

type dataParmas = {
  bookmarks: [];
  categories: [];
  next_cursor: string;
  has_next: boolean;
};

interface Tags {
  category_id: string;
  category_name: string;
}

const UnreadBookmarksPage: React.FC<ChildProps> = ({ activeTab }) => {
  const [originalBookmarks, setOriginalBookmarks] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [categories, setCategories] = useState<Tags[]>([]);
  const [cursor, setCursor] = useState("");
  const [hasNext, setHasNext] = useState(false);
  const [choosenCategories, setChoosenCategories] = useState<string[]>([]);

  const fetchBookmarks = async (query = "") => {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1];

    if (!token) return;

    try {
      let cursorUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/content/unread`;

      if (cursor !== "") {
        cursorUrl += "?cursor=" + encodeURIComponent(cursor);
      }
      const url = query.trim()
        ? `${
            process.env.NEXT_PUBLIC_API_BASE_URL
          }/content/search?query=${encodeURIComponent(query)}`
        : cursorUrl;

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch content");

      const data: dataParmas = await res.json();
      console.log("bookmark data being returned for unread page: ", data);

      if (data) {
        setBookmarks(data.bookmarks);
        setCategories(data.categories);
        setOriginalBookmarks(data.bookmarks);
        setCursor(data.next_cursor);
        setHasNext(data.has_next);
      } else {
        console.log("error occured, no data was returned from the unread api ");
      }
    } catch (err) {
      console.error("Error fetching bookmarks:", err);
    }
  };

  const handleScroll = () => {
    const scrollTop = window.scrollY;
    const windowHeight = window.innerHeight;
    const fullHeight = document.documentElement.scrollHeight;

    if (scrollTop + windowHeight >= fullHeight - 100) {
      console.log("near the bottom");
      if (hasNext === true) {
        loadNextBatch();
      } else {
        console.log("user has reached the end of his bookmarks");
      }
    }
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [bookmarks.length]);

  const loadNextBatch = async (query = "") => {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1];

    try {
      let contentApi = `${process.env.NEXT_PUBLIC_API_BASE_URL}/content`;
      console.log("CURRENT CURSOR:", cursor);
      if (cursor !== "") {
        contentApi += "?cursor=" + encodeURIComponent(cursor);
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
      console.log("bookmark data being returned: ", data);
      setOriginalBookmarks((prev) => [...prev, ...data.bookmarks]);
      setBookmarks((prev) => [...prev, ...data.bookmarks]);
      // setBookmarks(data.bookmarks);
      setCategories((prev) => {
        const incoming = (data.categories || []).filter(
          (c: Tags) => c?.category_name?.trim() !== "",
        );
        const byId = new Map(prev.map((c) => [c.category_id, c]));
        for (const c of incoming) byId.set(c.category_id, c);
        return Array.from(byId.values());
      });
      // setCategories(data.categories);
      setHasNext(data.has_next);
      if (data.has_next) {
        setCursor(data.next_cursor);
      }
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

      const filtered = originalBookmarks.filter((bookmark) => {
        const bookmarkNames = bookmark.tags.map((tag) => tag.category_name);
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
      <SearchInput onSearch={fetchBookmarks} />
      <CategoryFilter
        categories={categories}
        choosenCategories={choosenCategories}
        setChoosenCategories={setChoosenCategories}
      />
      <BookmarkList items={bookmarks} />

      {/* {hasNext && bookmarks.length > 0 && (
        <button onClick={() => loadNextBatch()}>load next</button>
      )} */}
    </>
  );
};

export default UnreadBookmarksPage;
