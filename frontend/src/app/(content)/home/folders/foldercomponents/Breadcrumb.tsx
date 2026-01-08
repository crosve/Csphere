import { ChevronRight } from "lucide-react";
import Link from "next/link";

interface PathProps {
  id: string;
  name: string;
}

interface BreadcrumbProps {
  paths: PathProps[];
}

export const Breadcrumb = ({ paths }: BreadcrumbProps) => {
  return (
    <div className="flex items-center gap-1 text-base text-gray-600 mb-4">
      <div className="flex items-center gap-1">
        <Link href={`/home/folders`} className="hover:underline text-gray-600">
          Folders
        </Link>
        <ChevronRight className="w-4 h-4" />
      </div>

      {paths.map((segment, index) => (
        <div key={segment.id} className="flex items-center gap-1">
          <Link
            href={`/home/folders/${segment.id}`}
            className="hover:underline text-gray-600"
          >
            {segment.name}
          </Link>
          {index < paths.length - 1 && <ChevronRight className="w-4 h-4" />}
        </div>
      ))}
    </div>
  );
};
