"use client";
import { useState } from "react";
import { Collapsible, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp } from "lucide-react";
import Account from "@/app/components/settings/Account";
import DataSettings from "@/app/components/settings/DataSettings";
import { motion, AnimatePresence } from "framer-motion";

const collapseVariants = {
  open: { opacity: 1, height: "auto" },
  collapsed: { opacity: 0, height: 0 },
};

const tabs: string[] = ["Account", "Notification", "Privacy", "Data"];

interface TabContent {
  title: string;
}

const CollapsibleTab = ({ title }: TabContent) => {
  const [isOpen, setIsOpen] = useState(false);

  const renderContent = () => {
    switch (title.toLowerCase()) {
      case "account":
        return <Account />;

      case "data":
        return <DataSettings />;

      default:
        return <h1>Coming soon!</h1>;
    }
  };

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="w-full space-y-2"
    >
      <motion.div
        layout
        className="flex items-center justify-between space-x-4 px-4 py-2 rounded-lg border-b-[1px]"
      >
        <h4 className="text-sm font-semibold">{title}</h4>
        <CollapsibleTrigger asChild>
          <button className="p-2">
            {isOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            <span className="sr-only">Toggle</span>
          </button>
        </CollapsibleTrigger>
      </motion.div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            className="px-1 overflow-hidden"
            initial="collapsed"
            animate="open"
            exit="collapsed"
            variants={collapseVariants}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            <div className="space-y-2">{renderContent()}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </Collapsible>
  );
};

function page() {
  return (
    <div className="w-full min-h-screen flex items-start justify-center bg-gray-300 py-8">
      <div className="flex flex-col items-start justify-start w-full md:w-2/3 max-w-4xl p-8">
        <h1 className="text-4xl mb-8 md:text-left text-center w-full font-bold text-gray-900">
          Settings
        </h1>

        <div className="w-full space-y-4">
          {tabs.map((tab) => (
            <CollapsibleTab key={tab} title={tab} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default page;
