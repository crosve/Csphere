"use client";
import { useEffect, useState, use } from "react";
import FolderIdLayout from "./FolderIdLayout";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Filter, ChevronDown, Sparkles, X } from "lucide-react";
import { fetchToken } from "@/functions/user/UserData";
import BookmarkList from "@/components/BookmarkList";
import { Breadcrumb } from "../foldercomponents/Breadcrumb";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import SettingsIcon from "@/components/ui/settings";
import { CiSettings } from "react-icons/ci";
import { DropdownMenuArrow } from "@radix-ui/react-dropdown-menu";

interface PathProps {
  id: string;
  name: string;
}

interface FolderMetadata {
  name: string;
  keywords: string[];
  urlPatterns: string[];
  smartBucketingEnabled: boolean;
}

// Folder Settings Dialog Component
function FolderSettingsDialog({
  folderId,
  initialMetadata,
  onSave,
}: {
  folderId: string;
  initialMetadata: FolderMetadata;
  onSave: (metadata: FolderMetadata) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [metadata, setMetadata] = useState<FolderMetadata>(initialMetadata);
  const [newKeyword, setNewKeyword] = useState("");
  const [newPattern, setNewPattern] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    setMetadata(initialMetadata);
  }, [initialMetadata]);

  const addKeyword = () => {
    if (
      newKeyword.trim() &&
      !metadata.keywords.includes(newKeyword.trim().toLowerCase())
    ) {
      setMetadata({
        ...metadata,
        keywords: [...metadata.keywords, newKeyword.trim().toLowerCase()],
      });
      setNewKeyword("");
    }
  };

  const removeKeyword = (index: number) => {
    setMetadata({
      ...metadata,
      keywords: metadata.keywords.filter((_, i) => i !== index),
    });
  };

  const addPattern = () => {
    if (
      newPattern.trim() &&
      !metadata.urlPatterns.includes(newPattern.trim())
    ) {
      setMetadata({
        ...metadata,
        urlPatterns: [...metadata.urlPatterns, newPattern.trim()],
      });
      setNewPattern("");
    }
  };

  const removePattern = (index: number) => {
    setMetadata({
      ...metadata,
      urlPatterns: metadata.urlPatterns.filter((_, i) => i !== index),
    });
  };

  const generateKeywords = () => {
    const name = metadata.name.toLowerCase();
    const generated = name.split(" ").filter((word) => word.length > 3);
    const suggestions = [...new Set([...metadata.keywords, ...generated])];
    setMetadata({ ...metadata, keywords: suggestions });
  };

  const handleSave = () => {
    onSave(metadata);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <form>
        <DialogTrigger asChild>
          <CiSettings className="w-8 h-8 hover:shadow-gray-300 cursor-pointer" />
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Folder Settings
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              Configure smart bucketing for this folder
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Folder Name */}
            <div>
              <Label
                htmlFor="folder-name"
                className="text-sm font-medium text-gray-700"
              >
                Folder Name
              </Label>
              <Input
                id="folder-name"
                disabled
                value={metadata.name}
                onChange={(e) =>
                  setMetadata({ ...metadata, name: e.target.value })
                }
                className="mt-1.5 bg-white border-gray-300 focus:border-gray-400 focus:ring-gray-400"
              />
            </div>

            {/* Smart Bucketing Toggle */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-gray-600" />
                  <div>
                    <div className="font-medium text-gray-900">
                      Smart Bucketing
                    </div>
                    <div className="text-sm text-gray-500">
                      Automatically suggest bookmarks for this folder
                    </div>
                  </div>
                </div>
                <Switch
                  checked={metadata.smartBucketingEnabled}
                  onCheckedChange={(checked) =>
                    setMetadata({ ...metadata, smartBucketingEnabled: checked })
                  }
                  className="data-[state=unchecked]:bg-gray-300 data-[state=checked]:bg-gray-900"
                />
              </div>
            </div>

            {/* Advanced Options */}
            {metadata.smartBucketingEnabled && (
              <>
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      showAdvanced ? "rotate-180" : ""
                    }`}
                  />
                  {showAdvanced ? "Hide" : "Show"} advanced options
                </button>

                {showAdvanced && (
                  <div className="space-y-6 pl-4 border-l-2 border-gray-200">
                    {/* Keywords Section */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-medium text-gray-700">
                          Keywords
                        </Label>
                        <button
                          onClick={generateKeywords}
                          className="text-xs text-gray-600 hover:text-gray-900 flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3" />
                          Auto-generate
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mb-3">
                        Bookmarks containing these words will be suggested for
                        this folder
                      </p>

                      <div className="flex flex-wrap gap-2 mb-3">
                        {metadata.keywords.map((keyword, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm border border-gray-200"
                          >
                            {keyword}
                            <button
                              onClick={() => removeKeyword(index)}
                              className="hover:text-gray-900"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <Input
                          value={newKeyword}
                          onChange={(e) => setNewKeyword(e.target.value)}
                          // onKeyPress={(e) => e.key === "Enter" && addKeyword()}
                          placeholder="Add keyword..."
                          className="flex-1 text-sm bg-white border-gray-300"
                        />
                        <Button
                          onClick={addKeyword}
                          variant="outline"
                          size="sm"
                          className="border-gray-300 hover:bg-gray-100"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* URL Patterns Section */}
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">
                        URL Patterns
                      </Label>
                      <p className="text-xs text-gray-500 mb-3">
                        Bookmarks matching these patterns will be suggested (use
                        * as wildcard)
                      </p>

                      <div className="flex flex-wrap gap-2 mb-3">
                        {metadata.urlPatterns.map((pattern, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-mono border border-gray-200"
                          >
                            {pattern}
                            <button
                              onClick={() => removePattern(index)}
                              className="hover:text-gray-900"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <Input
                          value={newPattern}
                          onChange={(e) => setNewPattern(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && addPattern()}
                          placeholder="e.g., *.github.com or docs.*.com"
                          className="flex-1 text-sm font-mono bg-white border-gray-300"
                        />
                        <Button
                          onClick={addPattern}
                          variant="outline"
                          size="sm"
                          className="border-gray-300 hover:bg-gray-100"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Preview */}
                    <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                      <div className="text-xs font-medium text-gray-700 mb-2">
                        Preview
                      </div>
                      <div className="text-xs text-gray-600">
                        Bookmarks with{" "}
                        <span className="font-medium text-gray-900">
                          {metadata.keywords.slice(0, 3).join(", ")}
                          {metadata.keywords.length > 3 &&
                            `... (+${metadata.keywords.length - 3})`}
                        </span>
                        {metadata.urlPatterns.length > 0 && (
                          <>
                            {" "}
                            or from{" "}
                            <span className="font-medium text-gray-900">
                              {metadata.urlPatterns.slice(0, 2).join(", ")}
                              {metadata.urlPatterns.length > 2 &&
                                `... (+${metadata.urlPatterns.length - 2})`}
                            </span>
                          </>
                        )}{" "}
                        will be suggested
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Button
                onClick={handleSave}
                className="flex-1 bg-gray-600 hover:bg-gray-500 text-white"
              >
                Save Changes
              </Button>
              <Button
                onClick={() => setIsOpen(false)}
                variant="outline"
                className="border-gray-300 hover:bg-gray-100"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </form>
    </Dialog>
  );
}

export default function Page({
  params,
}: {
  params: Promise<{ folderId: string }>;
}) {
  const { folderId } = use(params);
  const [bookmarks, setBookmarks] = useState([]);
  const [paths, setPaths] = useState<PathProps[]>([]);
  const [folderMetadata, setFolderMetadata] = useState<FolderMetadata>({
    name: "",
    keywords: [],
    urlPatterns: [],
    smartBucketingEnabled: false,
  });

  useEffect(() => {
    const fetchBookmarks = async (id: string) => {
      const API_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/folder/${id}`;
      const token = fetchToken();

      try {
        const response = await fetch(API_URL, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();
        if (data) {
          setBookmarks(data);
        }
      } catch (err) {
        console.error("Failed to fetch bookmarks", err);
      }
    };

    if (folderId) {
      fetchBookmarks(folderId);
    }
  }, [folderId]);

  useEffect(() => {
    const fetchPathStructure = async (id: string) => {
      try {
        const API_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/folder-path/${id}`;
        const token = fetchToken();
        const response = await fetch(API_URL, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();
        const path_data: PathProps[] = data.path;
        console.log("path_data:", path_data);
        setPaths(path_data);
      } catch (error) {
        console.log("error occured in fetchPathStructure", error);
      }
    };
    if (folderId) {
      fetchPathStructure(folderId);
    }
  }, [folderId]);

  // TODO: Fetch folder metadata from your API
  useEffect(() => {
    const fetchFolderMetadata = async (id: string) => {
      // Implement your API call here
      // const API_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/folder-metadata/${id}`;
      // const token = fetchToken();
      // const response = await fetch(API_URL, { ... });
      // const data = await response.json();
      // setFolderMetadata(data);
    };

    if (folderId) {
      // fetchFolderMetadata(folderId);
      // For now, using mock data
      setFolderMetadata({
        name: paths[paths.length - 1]?.name || "",
        keywords: [],
        urlPatterns: [],
        smartBucketingEnabled: false,
      });
    }
  }, [folderId, paths]);

  const handleSaveMetadata = async (metadata: FolderMetadata) => {
    // TODO: Save to your API
    // const API_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/folder-metadata/${folderId}`;
    // const token = fetchToken();
    // await fetch(API_URL, {
    //   method: 'PUT',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     Authorization: `Bearer ${token}`,
    //   },
    //   body: JSON.stringify(metadata),
    // });

    setFolderMetadata(metadata);
    console.log("Saved metadata:", metadata);
  };

  return (
    <FolderIdLayout>
      <div className="w-full space-y-6 gap-4 mb-4">
        <div className="flex items-center justify-between gap-3 mb-8">
          <Breadcrumb paths={paths} />

          <div className="flex items-center space-x-2 w-auto">
            <FolderSettingsDialog
              folderId={folderId}
              initialMetadata={folderMetadata}
              onSave={handleSaveMetadata}
            />
          </div>
        </div>

        <BookmarkList items={bookmarks} />
      </div>
    </FolderIdLayout>
  );
}
