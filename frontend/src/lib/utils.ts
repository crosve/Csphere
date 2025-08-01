import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useState } from 'react';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function formatDate(dateString: string): string {
  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    return "Invalid Date";
  }

  const local_date = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
    timeZoneName: "short",
  }).format(date);

  return local_date;
}

type ShareResult = Promise<{
  success: boolean;
  message?: string;
}>;

export const shareTo = {
  slack: async (bookmarkUrl: string): ShareResult => {
    return {
      success: false,
      message: 'Slack sharing coming soon'
    };
  },
  instagram: async (bookmarkUrl: string): ShareResult => {
    return {
      success: false,
      message: 'Instagram sharing coming soon'
    };
  },
  gmail: async (bookmarkUrl: string): ShareResult => {
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(
      'Check out this bookmark from CSphere')}&body=${encodeURIComponent(
      'I bookmarked this on CSphere: ' + bookmarkUrl)}`, '_blank');
      return { success: true};
  }
};