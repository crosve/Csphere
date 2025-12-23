"use client";
import React from "react";
const SettingsIcon = ({
  size = 24,
  color = "#EC4899",
  strokeWidth = 10,
  background = "#F3F4F6",
  opacity = 1,
  rotation = 0,
  shadow = 0,
  flipHorizontal = false,
  flipVertical = false,
  padding = 4,
}) => {
  const transforms = [];
  if (rotation !== 0) transforms.push(`rotate(${rotation}deg)`);
  if (flipHorizontal) transforms.push("scaleX(-1)");
  if (flipVertical) transforms.push("scaleY(-1)");

  const viewBoxSize = 24 + padding * 2;
  const viewBoxOffset = -padding;
  const viewBox = `${viewBoxOffset} ${viewBoxOffset} ${viewBoxSize} ${viewBoxSize}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        opacity,
        transform: transforms.join(" ") || undefined,
        filter:
          shadow > 0
            ? `drop-shadow(0 ${shadow}px ${shadow * 2}px rgba(0,0,0,0.3))`
            : undefined,
        backgroundColor: background !== "transparent" ? background : undefined,
      }}
    >
      <path
        fill="#BDC3C7"
        fillRule="evenodd"
        d="M97.55 85.718L45.407 33.574c-4.588-4.587 3.054-15.538-5.729-24.32L23.664 0l-3.381 3.38l8.832 8.831c3.381 3.38.849 10.983-2.545 14.377c-3.367 3.367-10.977 5.906-14.357 2.525l-8.833-8.83L0 23.664l9.254 16.014c8.734 8.735 19.87 1.277 24.321 5.729l52.143 52.144A8.367 8.367 0 0 0 97.55 85.718m-3.381 8.451a3.585 3.585 0 1 1-5.07-5.07a3.585 3.585 0 0 1 5.07 5.07"
        clipRule="evenodd"
      />
      <path
        fill="#95A5A6"
        d="M33.682 12.334L22.512 1.151L20.283 3.38l8.832 8.831c3.381 3.38.849 10.983-2.545 14.377c-3.367 3.367-10.977 5.906-14.357 2.525l-8.833-8.83l-1.975 1.975l11.177 11.19c1.524 1.525 3.914 2.332 6.911 2.332c4.492 0 9.453-1.824 12.063-4.437c4.417-4.42 6.311-14.822 2.126-19.009m62.064 75.615L45.775 37.972c-1.042-1.042-2.426-1.615-3.898-1.615s-2.857.574-3.898 1.615a5.52 5.52 0 0 0 0 7.798L87.95 95.746c1.041 1.042 2.426 1.615 3.898 1.615s2.857-.573 3.898-1.615a5.52 5.52 0 0 0 0-7.797m-1.577 6.22a3.585 3.585 0 1 1-5.07-5.07a3.585 3.585 0 0 1 5.07 5.07"
      />
      <path
        fill="#ECF0F1"
        fillRule="evenodd"
        d="M80 14L93 4l7 7l-10 13h-5L55 54l-5-5l30-30z"
        clipRule="evenodd"
      />
      <path
        fill="#BDC3C7"
        fillRule="evenodd"
        d="M52.5 51.5L55 54l30-30h5l10-13l-3.5-3.5z"
        clipRule="evenodd"
      />
      <path
        fill="#D35400"
        fillRule="evenodd"
        d="m42.51 46.095l.854.845L5.768 84.161a5.93 5.93 0 0 0 0 8.447l5.119 5.068c2.356 2.332 5.17 3.326 7.526.994l38.603-38.216l.853.845c.942.933 2.471.933 3.413 0s.942-2.446 0-3.379L45.923 42.716c-.942-.933-2.471-.933-3.413 0s-.943 2.446 0 3.379"
        clipRule="evenodd"
      />
      <path
        fill="#E66612"
        fillRule="evenodd"
        d="M50.25 53.75L8.594 95.406l2.293 2.271c2.356 2.332 5.17 3.326 7.526.994l38.573-38.186z"
        clipRule="evenodd"
      />
    </svg>
  );
};

export default SettingsIcon;
