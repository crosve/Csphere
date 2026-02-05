"use client";

import { motion } from "framer-motion";
import {
  Bookmark,
  Search,
  FolderSyncIcon as Sync,
  Shield,
  Zap,
  Folder,
} from "lucide-react";

const features = [
  {
    icon: Bookmark,
    title: "Smart Bookmarking",
    description:
      "Automatically categorize and tag your bookmarks with AI-powered organization.",
  },
  {
    icon: Search,
    title: "Instant Search",
    description:
      "Find any bookmark in seconds with our powerful search and filtering system.",
  },
  {
    icon: Sync,
    title: "Cross-Device Sync",
    description:
      "Access your bookmarks seamlessly across all your devices and browsers.",
  },
  {
    icon: Shield,
    title: "Privacy First",
    description:
      "Your data stays private. We don't track or store your personal information.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description:
      "Optimized for speed with instant bookmark saving and retrieval.",
  },
  {
    icon: Folder,
    title: "Smart Collections",
    description:
      "Organize bookmarks into intelligent collections that adapt to your usage.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
    },
  },
};

export default function FeatureSection() {
  return (
    <section id="features" className="pt-12 md:pt-16 pb-0 mt-0 mb-0 bg-gradient-to-b bg-gray-300 ">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-block bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 text-sm mb-6">
            Features
          </div>
          <h2 className="text-2xl md:text-5xl font-semibold mb-6">
            Everything you need to manage bookmarks
          </h2>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto font-semibold">
            Powerful features designed to transform how you save, organize, and
            access your favorite content
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ y: -2, scale: 1.01 }}
              className="group relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-white/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300" />
              <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 hover:border-white/20 transition-all duration-300">
                <div className="flex items-center justify-center w-14 h-14 bg-white/10 rounded-xl mb-6 group-hover:bg-white/20 transition-all duration-300">
                  <feature.icon className="w-7 h-7 text-gray-600" />
                </div>
                <h3 className="text-xl font-bold mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Demo Preview Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="mt-24 md:mt-24 text-center"
        >
          <h3
            id="csphere-demo"
            className="text-3xl md:text-4xl font-semibold mb-8"
          >
            Csphere in action
          </h3>
          <div className="relative max-w-4xl mx-auto">  
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/10 to-white/20 rounded-2xl blur-2xl" />
            <div className="relative bg-white/5 backdrop-blur-sm border border-white/20 rounded-2xl p-2">
              <div className="bg-[#1a2221] rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 p-4 border-b border-white/10">
                  <div className="w-3 h-3 bg-red-400 rounded-full" />
                  <div className="w-3 h-3 bg-yellow-400 rounded-full" />
                  <div className="w-3 h-3 bg-green-400 rounded-full" />
                  <div className="ml-4 text-sm text-gray-400">
                    Csphere Extension
                  </div>
                </div>
                <div className="aspect-video">
                  <iframe
                    className="w-full h-full"
                    src="https://www.youtube.com/embed/dbka770Q4Ig"
                    title="Csphere in action"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
