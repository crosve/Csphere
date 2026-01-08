"use client";
import { ReactNode, useState, useEffect, createContext } from "react";
import { Tabs } from "@/components/ui/tabs";
import { fetchToken } from "@/functions/user/UserData";
import { BookmarkToolbar, ViewMode } from "../BookmarkToolbar";
type Props = {
  children: ReactNode;
};

interface MetaDataProps {
  unreadCount: number;
}

export const LayoutContext = createContext<ViewMode>("grid");

function TagsLayout({ children }: Props) {
  const [activeTab, setActiveTab] = useState("latest");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [metaData, setMetaData] = useState<MetaDataProps>({
    unreadCount: 0,
  });
  console.log("active tab in bookmark layout: ", activeTab);

  useEffect(() => {
    const FetchMetaData = async () => {
      try {
        const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/content/unread/count`;
        const token = fetchToken();
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          method: "GET",
        });
        const data = await res.json();
        console.log("DATA BEING returned: ", data);
        if (data.status === "succesful") {
          console.log("medata dat count: ", data.total_count);
          setMetaData((prev) => ({
            ...prev,
            unreadCount: data.total_count,
          }));
        }
      } catch (error) {
        console.log("error occured in fetchimg meta data: ", error);
      }
    };

    FetchMetaData();
  }, []);

  return (
    <div className="container  px-4 py-8 min-h-screen flex flex-col space-y-6">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="mb-8 space-y-4"
      >
        <BookmarkToolbar
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          unreadCount={metaData.unreadCount}
        />
        {/* <CategoryFilter /> */}
        <LayoutContext.Provider value={viewMode}>
          {children}
        </LayoutContext.Provider>
      </Tabs>
    </div>
  );
}

export default TagsLayout;
