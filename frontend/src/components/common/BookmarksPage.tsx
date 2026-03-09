"use client";

import { useEffect, useState, useMemo, useRef } from "react";
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

  const [originalBookmarks, setOriginalBookmarks] = useState<Bookmark[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  const [categories, setCategories] = useState<Tags[]>([]);
  const [choosenCategories, setChoosenCategories] = useState<string[]>([]);


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
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/content/search?query=${encodeURIComponent(query)}`
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
          (c: Tags) => c?.category_name?.trim() !== ""
        );
        const byId = new Map(prev.map((c) => [c.category_id, c]));
        for (const c of incoming) byId.set(c.category_id, c);
        return Array.from(byId.values());
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
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/content/search?query=${encodeURIComponent(query)}`
        : contentApi;

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch content");

      const data = await res.json();

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
    fetchBookmarks();
  }, []);

  // 🔵 Inverted Index (rebuilt only when data changes)
  const categoryIndex = useMemo(() => {
    const idx = new Map<string, Bookmark[]>();
    for (const bm of originalBookmarks) {
      for (const cat of bm.categories) {
        let list = idx.get(cat.category_name);
        if (!list) {
          list = [];
          idx.set(cat.category_name, list);
        }
        list.push(bm);
      }
    }
    return idx;
  }, [originalBookmarks]);

  // 🔵 Filter cache
  const filterCache = useRef<Map<string, Bookmark[]>>(new Map());

  useEffect(() => {
    filterCache.current = new Map();
  }, [categoryIndex]);

  useEffect(() => {
    if (choosenCategories.length === 0) {
      setBookmarks(originalBookmarks);
      return;
    }

    const cacheKey = [...choosenCategories].sort().join("|");
    const cached = filterCache.current.get(cacheKey);

    if (cached) {
      setBookmarks(cached);
      return;
    }

    const seen = new Map<string, Bookmark>();

    for (const cat of choosenCategories) {
      const list = categoryIndex.get(cat);
      if (list) {
        for (const bm of list) {
          if (!seen.has(bm.content_id)) {
            seen.set(bm.content_id, bm);
          }
        }
      }
    }

    const filtered = Array.from(seen.values());
    filterCache.current.set(cacheKey, filtered);
    setBookmarks(filtered);
  }, [choosenCategories, categoryIndex, originalBookmarks]);

  return (
    <>
      <SearchInput onSearch={fetchBookmarks} />

      <CategoryFilter
        choosenCategories={choosenCategories}
        categories={categories}
        setChoosenCategories={setChoosenCategories}
      />

      <Suspense fallback={<Loading />}>
        <BookmarkList items={bookmarks} isFolder={false} />
      </Suspense>

      {!hasNext.current && (
        <h1 className="text-center">
          You've reached the end of your bookmarks!
        </h1>
      )}
    </>
  );
};

export default BookmarksPage;