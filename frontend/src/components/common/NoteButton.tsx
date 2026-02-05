import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { NotebookPen } from "lucide-react";
import { Check, Pen } from "lucide-react";

export function NoteButton({
    handleNotePopoverClick,
    editNotes,
    setEditNotes,
    noteContent,
    setNoteContent,
    bookmark,
    saveNoteToBackend,
}) {
    return (
       <div onClick={handleNotePopoverClick}>
            <Popover>
              <PopoverTrigger asChild>
                <NotebookPen className="text-gray-700 px-1 hover:cursor-pointer" />
              </PopoverTrigger>
              <PopoverContent
                side="top"
                align="start"
                sideOffset={10}
                className="w-80 z-10 relative bg-gradient-to-br from-white/80 to-white/60 text-black rounded-2xl shadow-xl p-0"
              >
                <div className="h-64">
                  {/* Content Area */}
                  <div className="relative h-full">
                    {editNotes ? (
                      <textarea
                        onChange={(e) => setNoteContent(e.target.value)}
                        value={noteContent}
                        placeholder="Start typing your note..."
                        className="w-full h-full resize-none rounded-xl p-3 bg-white/80 text-gray-800 placeholder-gray-500 text-sm leading-relaxed transition-all duration-200 focus:outline-none focus:ring-0 focus:border-none border-none"
                      />
                    ) : (
                      <div className="w-full h-full bg-white/60 backdrop-blur-sm rounded-xl p-3 overflow-y-auto">
                        {noteContent ? (
                          <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                            {noteContent}
                          </p>
                        ) : (
                          <p className="text-gray-500 text-sm italic flex items-center justify-center h-full">
                            Click the pen to add a note...
                          </p>
                        )}
                      </div>
                    )}
                    <button
                      onClick={async () => {
                        if (editNotes) {
                          const success = await saveNoteToBackend(
                            bookmark.content_id,
                            noteContent
                          );
                          if (success) {
                            setEditNotes(false); // Exit edit mode
                          }
                        } else {
                          setEditNotes(true); // Enter edit mode
                        }
                      }}
                      className={`group overflow-hidden rounded-full w-12 h-12 flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 absolute bottom-4 right-4 focus:outline-none focus:ring-0 focus:border-none border-none ${
                        editNotes
                          ? "bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/30"
                          : "bg-gray-800 hover:bg-gray-700 shadow-lg shadow-gray-800/30"
                      }`}
                      title={editNotes ? "Save note" : "Edit note"}
                    >
                      <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
                      {editNotes ? (
                        <Check className="text-white h-5 w-5 relative z-10 transition-transform duration-200 group-hover:scale-110" />
                      ) : (
                        <Pen className="text-white h-5 w-5 relative z-10 transition-transform duration-200 group-hover:scale-110" />
                      )}
                    </button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div> 
    )
}