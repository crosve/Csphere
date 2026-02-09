"use client";

import { Download, Play, Bookmark, Globe, FolderTree } from "lucide-react";

import { motion, useScroll } from "framer-motion";
import FeatureSection from "@/components/common/FeatureSection";

const features = [
  {
    icon: <Bookmark className="h-5 w-5 text-black" />,
    title: "Save and organize your research",
    desc: "Collect articles, papers, and resources from across the web in one centralized location. Never lose track of important information again.",
    imageAlt: "Bookmark collection interface",
    imageSrc: "/csphere-chrome.mp4",
  },
  {
    icon: <Globe className="h-5 w-5 text-black" />,
    title: "Access your content anywhere",
    desc: "Seamlessly sync your saved content across all your devices. Your bookmarks are always available whether you're at home, work, or on the go.",
    imageAlt: "Cross-device synchronization",
    imageSrc: "/csphere-home.png",
  },
  {
    icon: <FolderTree className="h-5 w-5 text-black" />,
    title: "Organize with smart collections",
    desc: "Create custom collections and let our AI help categorize your content automatically. Find what you need when you need it with powerful search and filtering.",
    imageAlt: "Smart collections and organization",
    imageSrc: "/csphere-search.mp4",
  },
];

export default function LandingPage() {
  const { scrollYProgress } = useScroll();

  const featuresWithTransforms = features.map((feature, index) => {
    const start = index / features.length;
    const end = (index + 1) / features.length;

    const fadeStart = start + 0.05;
    const fadeEnd = end - 0.05;

    return {
      ...feature,
      start,
      end,
      fadeStart,
      fadeEnd,
    };
  });

  return (
    <div className="min-h-screen bg-gray-300">
      {/* Header */}

      {/* Hero Section */}
      <main className="min-h-screen w-full flex items-center justify-center text-white bg-gray-300 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br " />
        <div className="absolute top-20 left-10 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/3 rounded-full blur-3xl" />

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center justify-center w-11/12 md:w-10/12 lg:w-8/12 h-full gap-8 mt-12 relative z-10"
        >
          <section className="max-w-4xl text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-4xl md:text-5xl lg:text-6xl text-center mb-6 leading-tight font-normal"
            >
              Rediscover your bookmarks with{" "}
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="block mt-4 font-bold italic text-[#202A29] text-5xl md:text-6xl lg:text-7xl bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text"
              >
                Csphere
              </motion.span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-base md:text-xl text-gray-200 mt-8 max-w-3xl mx-auto leading-relaxed"
            >
              AI-powered bookmark manager that brings your content back to life.
              Search, organize, and rediscover everything you've ever saved.
            </motion.p>
          </section>

          <motion.section className="flex flex-col sm:flex-row justify-center gap-4 w-full max-w-md">
            <motion.a
              href="https://chromewebstore.google.com/detail/csphere/naacmldkjnlfmhnkbbpppjpmdoiednnn"
              target="_blank"
              className="bg-white text-[#202A29] text-sm font-semibold px-6 py-3 rounded-xl w-full text-center  transition-all  flex items-center justify-center gap-2 shadow-sm "
              rel="noreferrer"
            >
              <Download className="w-6 h-2" />
              Download Chrome Extension
            </motion.a>

            <motion.a
              href="#csphere-demo"
              className="text-white text-sm font-semibold px-6 py-3 w-full text-center transition-all duration-300 bg-[#202A29]   border border-white/20 rounded-xl flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" />
              View Demo
            </motion.a>
          </motion.section>
        </motion.div>
      </main>

      {/* Feature Section Component */}
      <FeatureSection />

      {/* Final CTA Section */}
      <section className="pt-24 md:pt-24 pb-20 md:pb-32 flex w-full h-full items-center justify-center bg-gray-300 text-white">
        <div className="container px-4 md:px-6 text-center">
          <div className="space-y-8 max-w-3xl mx-auto">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl"
            >
              Ready to organize your bookmarks?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-xl text-gray-300"
            >
              Join today to transform your bookmark chaos into an organized,
              searchable knowledge base.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <motion.a
                href="https://chromewebstore.google.com/detail/csphere/naacmldkjnlfmhnkbbpppjpmdoiednnn"
                target="_blank"
                className="bg-white text-[#202A29] text-sm font-semibold px-6 py-3 rounded-xl w-auto text-center  transition-all  flex items-center justify-center gap-2 shadow-sm "
                rel="noreferrer"
              >
                <Download className="w-6 h-2" />
                Add to Chrome - It's free
              </motion.a>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
