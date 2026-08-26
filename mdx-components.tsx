import type { MDXComponents } from "mdx/types";
import { Page } from "@/components/Page";

// MDX の見出しと段落を、サイトの他のページと同じ枠に載せる(F-11)。
// 記事本文は src/app/journal/<slug>/page.mdx にあり、一覧は src/content/journal.ts。
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({ children }) => <h1>{children}</h1>,
    wrapper: ({ children }) => (
      <main className="page">
        <div className="prose">{children}</div>
      </main>
    ),
    ...components,
  };
}

export { Page };
