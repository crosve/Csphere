import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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
    // hour: "numeric",
    // minute: "numeric",
    // hour12: true,
    // timeZoneName: "short",
  }).format(date);

  return local_date;
}

type ShareResult = Promise<{
  success: boolean;
  message?: string;
}>;

export const shareTo = {
  slack: (bookmarkUrl: string) =>
    openLogIn("Slack", "https://slack.com/signin#/signin", bookmarkUrl),
  instagram: (bookmarkUrl: string) =>
    openLogIn("Instagram", "https://www.instagram.com", bookmarkUrl),
  gmail: async (bookmarkUrl: string): ShareResult => {
    window.open(
      `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(
        "Check out this bookmark from Csphere!"
      )}&body=${encodeURIComponent(
        "I bookmarked this on Csphere: " +
          bookmarkUrl +
          "\n\nStart bookmarking on Csphere: https://csphere.io/"
      )}`,
      "_blank"
    );
    return { success: true };
  },
  messages: async (bookmarkUrl: string): ShareResult => {
    navigator.clipboard
      .writeText("I bookmarked this on Csphere: " + bookmarkUrl) // permission asked for seeing copies of images/text
      .then(() =>
        alert("Message copied! Please paste it into your messaging app.")
      )
      .catch(() => {
        const textArea = document.createElement("textarea");
        textArea.value = "I bookmarked this on Csphere: " + bookmarkUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        alert("Text copied to clipboard");
      });
    return { success: true };
  },
};

async function openLogIn(
  platformName: string,
  redirectUrl: string,
  bookmarkUrl: string
): Promise<ShareResult> {
  try {
    const redirectPermission = await requestRedirectPermission();
    if (!redirectPermission) {
      return {
        success: false,
        message: "Please allow popups for sharing to work.",
      };
    }

    let clipboardError = false;
    try {
      await navigator.clipboard.writeText(bookmarkUrl);
    } catch {
      clipboardError = true;
    }

    if (clipboardError) {
      return {
        success: false,
        message:
          "Copying was blocked! Please allow clipboard access for this site.",
      };
    }

    alert(`Link copied for ${platformName}. Redirecting now...`);
    const newWindow = window.open("", "_blank");
    if (!newWindow || newWindow.closed) {
      return {
        success: false,
        message:
          "Redirect failed. Please make sure popups are allowed for this site.",
      };
    }
    newWindow.location.href = redirectUrl;
    return { success: true };
  } catch {
    return {
      success: false,
      message: "Sharing failed. Please check permissions.",
    };
  }
}

export const requestRedirectPermission = async (): Promise<boolean> => {
  try {
    if ("permissions" in navigator) {
      const result = await navigator.permissions.query({
        name: "open-window" as any,
      });
      return result.state === "granted";
    }
    return true;
  } catch (err) {
    console.warn("Permission check failed:", err);
    return true;
  }
};
