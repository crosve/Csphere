import BookmarksPage from "@/components/common/BookmarksPage";

interface BookmarkListProps {
  activeTab?: string;
}
const Page = ({ activeTab }: BookmarkListProps) => {
  return <BookmarksPage activeTab={activeTab} />;
};

export default Page;
