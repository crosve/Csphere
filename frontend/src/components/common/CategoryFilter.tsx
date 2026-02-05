// components/CategoryFilter.tsx
import React, { useState } from "react";

interface Tags {
  category_id: string;
  category_name: string;
}

interface CategoryData {
  ai_summary: string;
  content_id: string;
  first_saved_at: string;
  notes: string;
  source: string;
  tags: Tags[];
  title: string;
  url: string;
}

interface ChildProps {
  choosenCategories: string[];
  categories: Tags[];
  setChoosenCategories: React.Dispatch<React.SetStateAction<string[]>>;
}

interface CategoryButtonProps {
  category_name: string;
  choosenCategories: string[];
  setChoosenCategories: React.Dispatch<React.SetStateAction<string[]>>;
}

const CategoryButton: React.FC<CategoryButtonProps> = ({
  category_name,
  choosenCategories,
  setChoosenCategories,
}) => {
  const [selected, setSelected] = useState(false);

  const handleAppend = () => {
    const exists = choosenCategories.includes(category_name);
    if (!exists) {
      setChoosenCategories((prev) => [...prev, category_name]);
    } else {
      //Need to remove the category
      setChoosenCategories((prev) =>
        prev.filter(function (category) {
          return category !== category_name;
        })
      );
    }
    setSelected((prev) => !prev);
  };

  return (
    <button
      onClick={handleAppend}
      className={`px-3 py-1 rounded-full border-[0.5px] border-black text-sm text-black hover:bg-[#202A29] hover:text-white transition-colors
      ${selected ? "bg-[#202A29] text-white" : ""}`}
    >
      {category_name}
    </button>
  );
};

const CategoryFilter: React.FC<ChildProps> = ({
  choosenCategories,
  categories,
  setChoosenCategories,
}) => {
  return (
    <div className="flex flex-wrap gap-2 justify-start mb-8">
      {categories?.map((category, index: number) => (
        <CategoryButton
          key={index}
          category_name={category.category_name}
          choosenCategories={choosenCategories}
          setChoosenCategories={setChoosenCategories}
        />
      ))}
    </div>
  );
};

export default CategoryFilter;
