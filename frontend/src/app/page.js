import Image from "next/image";
import FeatureSection from "@/components/FeatureSection";

export default function Home() {
  return (
    <div className="pt-serif-bold">
      <main className="min-h-screen w-full flex items-center justify-center text-white bg-[#202A29]">
        <div className="flex flex-col items-center justify-center w-10/12 md:w-8/12 h-full gap-10">
          <section className="max-w-3xl">
            <h1 className="text-5xl md:text-6xl pt-serif-regular  text-center  text-white  mb-8">
              Save and revisit your favorite bookmarks with{" "}
              <span className="block mt-2 font-bold italic text-6xl">
                CSphere
              </span>
            </h1>

            <p className="text-2xl text-center pt-serif-semibold text-gray-300 mb-4 max-w-2xl mx-auto">
              Never miss out on saving your content again.
            </p>
          </section>

          <section className="flex flex-col md:flex-row justify-center gap-6 w-[300px] md:w-[400px] lg:w-[500px]">
            <button className="bg-white text-gray-900 text-sm font-medium px-6 py-3 rounded-lg w-full text-center hover:bg-gray-100 transition duration-300 flex items-center justify-center">
              Download Chrome Extension
            </button>
            <a
              href="#feature-section"
              className="text-white text-sm font-medium px-6 py-3 w-full text-center hover:text-gray-200 transition duration-300 bg-[#202A29] rounded-lg flex items-center justify-center"
            >
              View Demo
            </a>
          </section>
        </div>
      </main>
      <section id="feature-section" className="w-full  h-[800px]">
        <FeatureSection />
      </section>
    </div>
  );
}
