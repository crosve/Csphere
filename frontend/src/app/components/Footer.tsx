import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  const footerLinks = [
    { label: "Features", href: "/#features" },
    {
      label: "Chrome Extension",
      href: "https://chromewebstore.google.com/detail/csphere/naacmldkjnlfmhnkbbpppjpmdoiednnn",
      external: true,
    },
    { label: "Privacy", href: "/privacy" },
    { label: "Contact", href: "mailto:angelo.vitalino5@gmail.com", external: true },
    {
      label: "GitHub",
      href: "https://github.com/angvit/Csphere",
      external: true,
    },
  ].filter((l) => Boolean(l.href && l.href.trim() && l.label && l.label.trim()) && l.href !== "#");

  return (
    <footer
      id="contact"
      className="bg-[#202A29] flex w-full items-center justify-center text-white pt-6 pb-6 relative"
    >
      <div className="container px-4 md:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="rounded p-2 flex items-center justify-start">
            <div className="w-16 h-16 md:w-20 md:h-20 relative">
              <Image
                src="/cspherelogo2.png"
                alt="Logo"
                fill
                className="object-contain invert brightness-0"
                sizes="(max-width: 768px) 64px, (max-width: 1024px) 80px, 80px"
                priority
                quality={100}
              />
            </div>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-gray-400">
            {footerLinks.map((l) =>
              l.external ? (
                <a
                  key={l.label}
                  href={l.href}
                  target={l.href.startsWith("http") ? "_blank" : undefined}
                  rel={l.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="hover:text-white transition-colors"
                >
                  {l.label}
                </a>
              ) : (
                <Link key={l.label} href={l.href} className="hover:text-white transition-colors">
                  {l.label}
                </Link>
              )
            )}
          </nav>

          <div className="text-center sm:text-right text-white">
            <h3 className="!text-white">2025 Csphere. All rights reserved.</h3>
          </div>
        </div>
      </div>
    </footer>
  );
}
