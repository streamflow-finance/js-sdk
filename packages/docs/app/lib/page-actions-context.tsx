import { createContext, useContext } from "react";

interface PageActionsContextValue {
  markdownUrl: string;
  githubUrl: string;
}

export const PageActionsContext = createContext<PageActionsContextValue>({
  markdownUrl: "",
  githubUrl: "",
});

export function usePageActions() {
  return useContext(PageActionsContext);
}
