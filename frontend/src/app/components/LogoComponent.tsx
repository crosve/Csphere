"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { ImageLoader } from "next/image";
import Image from "next/image";

import Link from "next/link";

function LogoComponent() {
  const isTokenPresent = true;
  const pathname = usePathname();
  const [token, setToken] = useState(null);

  useEffect(() => {
    const cookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="));
    const foundToken = cookie ? cookie.split("=")[1] : null;
    setToken(foundToken);
  }, [pathname]);

  return (
    <>
      <Link href={token ? "/home" : "/"} className="flex items-center">
        <div className="bg-gray-300 rounded p-2 flex items-center justify-center">
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
      <nav className="hidden md:flex md:items-center md:space-x-6">
        {!token ? (
          <>
            <a
              href="#"
              className="text-base font-medium text-[#202A29] hover:text-gray-700"
            >
              About us
            </a>
          </>
        ) : (
          <></>
        )}
      </nav>
    </>
  );
}

export default LogoComponent;
