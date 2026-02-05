"use client";
import { ReactNode, useState, createContext, useEffect } from "react";
import SearchInput from "@/components/common/SearchInput";
import { Tabs } from "@/components/ui/tabs";
import { fetchToken } from "@/functions/user/UserData";
import { BookmarkToolbar, ViewMode } from "./BookmarkToolbar";

type Props = {
  children: ReactNode;
};

interface MetaDataProps {
  unreadCount: number;
}
export const LayoutContext = createContext<ViewMode>("grid");

export default function Layout({ children }: Props) {
  const [activeTab, setActiveTab] = useState("latest");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [metaData, setMetaData] = useState<MetaDataProps>({
    unreadCount: 0,
  });

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
        if (data.status === "succesful") {
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
    <div className="min-h-screen w-full bg-gray-50">
      <main className="w-full">
        <div className="flex flex-col gap-8 md:flex-row w-full">
          <div className="flex-1 w-full items-center justify-center flex overflow-visible relative z-0">
            <div className="container  px-4 py-8 min-h-screen flex flex-col space-y-6">
              original
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="mb-8 space-y-4 "
              >
                <BookmarkToolbar
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                  unreadCount={metaData.unreadCount}
                />

                <LayoutContext.Provider value={viewMode}>
                  {children}
                </LayoutContext.Provider>
              </Tabs>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
