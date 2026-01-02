"use client";

import React from "react";
// import { usePathname } from "next/navigation";
import Image from "next/image";

import Link from "next/link";

function LogoComponent() {
  return (
    <>
      <Link href="/" className="flex items-center">
        <div className="rounded p-2 flex items-center justify-center">
          <div className="w-16 h-16 md:w-20 md:h-20 lg:w-32 lg:h-32 relative">
            <Image
              src="/cspherelogo2.png"
              alt="Logo"
              fill
              className="object-contain"
              sizes="(max-width: 768px) 64px, (max-width: 1024px) 80px, 128px"
              priority
              quality={100}
            />
          </div>
        </div>
      </Link>
      {/* <nav className="hidden md:flex md:items-center md:space-x-6">
        <Link href="/chrome-setup" className="text-sm">
          Chrome setup
        </Link>
      </nav> */}
    </>
  );
}

export default LogoComponent;
