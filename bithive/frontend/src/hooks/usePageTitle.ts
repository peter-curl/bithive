import { useEffect } from "react";

export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} | BitHive` : "BitHive — Fund the Future with Bitcoin";
  }, [title]);
}
