"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import BookmarkList from "./BookmarkList";
import CategoryFilter from "./CategoryFilter";
import SearchInput from "./SearchInput";

type ChildProps = {
  activeTab?: string;
};

type dataParmas = {
  bookmarks: any[];
  categories: any[];
  next_cursor: string;
  has_next: boolean;
};

interface Tags {
  category_id: string;
  category_name: string;
}

const UnreadBookmarksPage: React.FC<ChildProps> = ({ activeTab }) => {
  const [originalBookmarks, setOriginalBookmarks] = useState<any[]>([]);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [categories, setCategories] = useState<Tags[]>([]);
  const [cursor, setCursor] = useState("");
  const [hasNext, setHasNext] = useState(false);
  const [choosenCategories, setChoosenCategories] = useState<string[]>([]);

  const nextBatchLoading = useRef(false);

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
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/content/search?query=${encodeURIComponent(query)}`
        : cursorUrl;

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch content");

      const data: dataParmas = await res.json();
      console.log("bookmark data being returned for unread page:", data);

      if (data) {
        setBookmarks(data.bookmarks);
        setCategories(data.categories);
        setOriginalBookmarks(data.bookmarks);
        setCursor(data.next_cursor);
        setHasNext(data.has_next);
      }
    } catch (err) {
      console.error("Error fetching bookmarks:", err);
    }
  };

  const loadNextBatch = async () => {
    if (!hasNext || nextBatchLoading.current) return;

    nextBatchLoading.current = true;

    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1];

    try {
      let contentApi = `${process.env.NEXT_PUBLIC_API_BASE_URL}/content/unread`;
      console.log("CURRENT CURSOR:", cursor);

      if (cursor !== "") {
        contentApi += "?cursor=" + encodeURIComponent(cursor);
      }

      console.log("fetching at this api endpoint:", contentApi);

      const res = await fetch(contentApi, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch content");

      const data = await res.json();
      console.log("bookmark data being returned:", data);

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

      setHasNext(data.has_next);
      if (data.has_next) {
        setCursor(data.next_cursor);
      }
    } catch (err) {
      console.error("Error fetching bookmarks:", err);
    } finally {
      nextBatchLoading.current = false;
    }
  };

  const handleScroll = () => {
    const scrollTop = window.scrollY;
    const windowHeight = window.innerHeight;
    const fullHeight = document.documentElement.scrollHeight;

    if (scrollTop + windowHeight >= fullHeight - 100) {
      console.log("near the bottom");
      loadNextBatch();
    }
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    fetchBookmarks();
  }, []);

  // ── Pre-built category index ──
  const categoryIndex = useMemo(() => {
    const idx = new Map<string, any[]>();
    for (const bm of originalBookmarks) {
      for (const tag of bm?.tags ?? []) {
        let list = idx.get(tag.category_name);
        if (!list) {
          list = [];
          idx.set(tag.category_name, list);
        }
        list.push(bm);
      }
    }
    return idx;
  }, [originalBookmarks]);

  const filterCache = useRef<Map<string, any[]>>(new Map());

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

    const seen = new Map<string, any>();

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
        categories={categories}
        choosenCategories={choosenCategories}
        setChoosenCategories={setChoosenCategories}
      />
      <BookmarkList items={bookmarks} />
    </>
  );
};

export default UnreadBookmarksPage;