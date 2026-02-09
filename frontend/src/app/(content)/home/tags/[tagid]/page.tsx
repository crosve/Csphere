"use client";
import { useEffect, useState, use } from "react";
import { fetchToken } from "@/functions/user/UserData";
import BookmarkList from "@/components/common/BookmarkList";

function page({ params }: { params: Promise<{ tagid: string }> }) {
  const [bookmarks, setBookmarks] = useState([]);
  const { tagid } = use(params);

  useEffect(() => {
    const fetchBookmarks = async (tagid: string) => {
      const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/tag/bookmark/${tagid}`;
      const token = fetchToken();
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        method: "GET",
      });
      const data = await res.json();
      console.log("data being returned: ", data);
      setBookmarks(data);
    };

    if (tagid === undefined || tagid === "") {
      return;
    }
    fetchBookmarks(tagid);
  }, [tagid]);

  return (
    <div>
      <BookmarkList items={bookmarks} />
    </div>
  );
}

export default page;
