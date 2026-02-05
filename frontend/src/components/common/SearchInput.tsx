"use client";

import { useState } from "react";
import { Search } from "lucide-react";

type Props = {
  onSearch: (query: string) => void;
};

export default function SearchInput({ onSearch }: Props) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
    }
  };

  return (
    <form onSubmit={handleSubmit} className=" max-w-2xl relative">
      <input
        id="search-form"
        type="text"
        placeholder="Search..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full px-4 py-2 pr-12 rounded-2xl border border-black text-black placeholder-gray-400 bg-gray-300
    focus:outline-none focus:ring-2 focus:ring-gray-600 
    hover:ring-2 hover:ring-gray-600"
      />

      <button
        type="submit"
        className="absolute inset-y-0 right-3 flex items-center justify-center"
      >
        <Search className="h-5 w-5 text-gray-500" />
      </button>
    </form>
  );
}
