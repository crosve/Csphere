"use client";

import { useState, useRef, useCallback } from "react";
import { HiSearch, HiX, HiArrowLeft, HiExternalLink } from "react-icons/hi";
import { BiLoaderAlt } from "react-icons/bi";

interface SearchResult {
  title: string;
  link: string;
  displayLink: string;
  snippet: string;
  pagemap?: {
    cse_thumbnail?: { src: string }[];
  };
}

interface SearchPanelProps {
  onClose: () => void;
  /** Called when user wants to load a URL into the main iframe */
  onLoadUrl?: (url: string) => void;
}

type PanelView = "search" | "preview";

export function SearchPanel({ onClose, onLoadUrl }: SearchPanelProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>("");
  const [view, setView] = useState<PanelView>("search");
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    setError(null);
    setResults([]);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }

      setResults(data.items ?? []);
    } catch {
      setError("Failed to fetch results");
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleOpenPreview = (result: SearchResult) => {
    setPreviewUrl(result.link);
    setPreviewTitle(result.title);
    setView("preview");
    setIsPreviewLoading(true);
  };

  const handleLoadInMain = () => {
    if (previewUrl && onLoadUrl) {
      onLoadUrl(previewUrl);
      onClose();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-3 border-b border-gray-100 flex-shrink-0">
        {view === "preview" ? (
          <button
            onClick={() => setView("search")}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-800"
          >
            <HiArrowLeft className="w-4 h-4" />
          </button>
        ) : (
          <div className="w-5 h-5 flex items-center justify-center">
            <HiSearch className="w-4 h-4 text-gray-400" />
          </div>
        )}

        <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest flex-1">
          {view === "preview" ? (
            <span className="text-gray-700 normal-case tracking-normal font-medium truncate block">
              {previewTitle}
            </span>
          ) : (
            "Web Search"
          )}
        </span>

        {view === "preview" && previewUrl && (
          <button
            onClick={handleLoadInMain}
            title="Open in main view"
            className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors font-medium"
          >
            <HiExternalLink className="w-3.5 h-3.5" />
            Open
          </button>
        )}

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
        >
          <HiX className="w-4 h-4" />
        </button>
      </div>

      {/* Search View */}
      {view === "search" && (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Search Input */}
          <div className="px-3 py-3 flex-shrink-0">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus-within:border-blue-400 focus-within:bg-white transition-all">
              <HiSearch className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search the web..."
                className="flex-1 text-sm bg-transparent outline-none text-gray-800 placeholder-gray-400"
                autoFocus
              />
              {query && (
                <button
                  onClick={() => {
                    setQuery("");
                    setResults([]);
                    inputRef.current?.focus();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <HiX className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              onClick={handleSearch}
              disabled={isLoading || !query.trim()}
              className="mt-2 w-full py-2 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <BiLoaderAlt className="w-4 h-4 animate-spin" />
                  Searching...
                </span>
              ) : (
                "Search"
              )}
            </button>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto px-3 pb-4">
            {error && (
              <div className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            {!isLoading && results.length === 0 && !error && (
              <div className="flex flex-col items-center justify-center h-40 gap-2">
                <HiSearch className="w-8 h-8 text-gray-200" />
                <p className="text-xs text-gray-400">
                  Search for anything to get started
                </p>
              </div>
            )}

            <div className="flex flex-col gap-2">
              {results.map((result, i) => {
                const thumbnail =
                  result.pagemap?.cse_thumbnail?.[0]?.src;
                return (
                  <button
                    key={i}
                    onClick={() => handleOpenPreview(result)}
                    className="text-left w-full group p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all duration-150"
                  >
                    <div className="flex gap-3 items-start">
                      {thumbnail && (
                        <img
                          src={thumbnail}
                          alt=""
                          className="w-12 h-10 object-cover rounded-lg flex-shrink-0 bg-gray-100"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-green-700 truncate font-medium mb-0.5">
                          {result.displayLink}
                        </p>
                        <p className="text-sm font-semibold text-blue-600 group-hover:text-blue-700 line-clamp-2 leading-snug">
                          {result.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                          {result.snippet}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Preview View */}
      {view === "preview" && previewUrl && (
        <div className="flex-1 relative overflow-hidden">
          {isPreviewLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10 gap-3">
              <BiLoaderAlt className="w-6 h-6 text-blue-400 animate-spin" />
              <p className="text-xs text-gray-400">Loading page...</p>
            </div>
          )}
          <iframe
            src={previewUrl}
            className="w-full h-full border-none"
            title="Search result preview"
            onLoad={() => setIsPreviewLoading(false)}
            sandbox="allow-same-origin allow-scripts allow-forms"
          />
        </div>
      )}
    </div>
  );
}
