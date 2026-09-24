"use client";

import { useRouter } from "next/navigation";

/** Returns to the results page the user actually came from (browser
 *  history), rather than always landing on the homepage - falls back to
 *  home only if there's nowhere to go back to (e.g. a direct/shared link). */
export default function BackLink() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window !== "undefined" && window.history.length > 1) {
          router.back();
        } else {
          router.push("/");
        }
      }}
      className="text-sm font-medium text-orange-700 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300"
    >
      ← Back
    </button>
  );
}
