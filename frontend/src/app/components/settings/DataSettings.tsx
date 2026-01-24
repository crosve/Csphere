import React from "react";

function DataSettings() {
  if ("showOpenFilePicker" in self) {
    console.log("available");
    // The `showOpenFilePicker()` method of the File System Access API is supported.
  }

  const handleButton = async () => {
    try {
      // 1. Define the file types you want to allow
      const pickerOptions = {
        types: [
          {
            description: "Chrome Bookmarks (JSON or CSV)",
            accept: {
              "application/json": [".json"],
              "text/csv": [".csv"],
              "text/html": [".html"], // In case they use the manual Export file
            },
          },
        ],
        excludeAcceptAllOption: true,
        multiple: false,
      };

      let fileHandle;

      // 2. Open the picker
      [fileHandle] = await (window as any).showOpenFilePicker();

      // 3. Get the file and its content
      const file = await fileHandle.getFile();
      const contents = await file.text();

      // 4. Do something with the data
      console.log("File Name:", file.name);

      if (file.name.endsWith(".json")) {
        const jsonData = JSON.parse(contents);
        console.log("Parsed Bookmarks:", jsonData);
      } else {
        console.log("File Contents:", contents);
      }
    } catch (err) {
      // Handle the user cancelling the picker
      if (err.name !== "AbortError") {
        console.error(err.name, err.message);
      }
    }
  };
  return (
    <div className="max-w-2xl mx-auto p-4 space-y-8">
      {/* User Info Section */}
      <div className="bg-gray-300 rounded-lg shadow-sm border p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Import Bookmarks
        </h1>
        <button onClick={() => handleButton()}>Click me</button>

        {/* Google Account Section */}
      </div>
    </div>
  );
}

export default DataSettings;
