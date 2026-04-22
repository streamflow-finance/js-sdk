import { Suspense } from "react";
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  MarkdownCopyButton,
  ViewOptionsPopover,
} from "fumadocs-ui/layouts/docs/page";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import browserCollections from "collections/browser";
import { source } from "@/lib/source";
import { useFumadocsLoader } from "fumadocs-core/source/client";
import { useMDXComponents } from "@/components/mdx";
import { baseOptions } from "@/lib/layout.shared";
import { PageActionsContext, usePageActions } from "@/lib/page-actions-context";

import type { Route } from "./+types/docs";

function PageActions() {
  const { markdownUrl, githubUrl } = usePageActions();

  return (
    <div className="flex flex-row gap-2 items-center border-b pt-2 pb-6">
      <MarkdownCopyButton markdownUrl={markdownUrl} />
      <ViewOptionsPopover markdownUrl={markdownUrl} githubUrl={githubUrl} />
    </div>
  );
}

export async function loader({ params }: Route.LoaderArgs) {
  const slugs = params["*"].split("/").filter((v: string) => v.length > 0);
  const page = source.getPage(slugs);
  if (!page) throw new Response("Not found", { status: 404 });

  const markdownUrl = `/docs/${slugs.join("/")}.mdx`;
  const githubUrl = `https://github.com/streamflow-finance/js-sdk/blob/main/packages/docs/content/${page.path}`;

  return {
    path: page.path,
    pageType: page.type,
    pageTree: await source.serializePageTree(source.getPageTree()),
    markdownUrl,
    githubUrl,
  };
}

const docsClientLoader = browserCollections.docs.createClientLoader({
  component({ toc, frontmatter, default: Mdx }) {
    return (
      <DocsPage toc={toc}>
        <title>{frontmatter.title}</title>
        <meta name="description" content={frontmatter.description} />
        <DocsTitle>{frontmatter.title}</DocsTitle>
        <DocsDescription>{frontmatter.description}</DocsDescription>
        <PageActions />
        <DocsBody>
          <Mdx components={useMDXComponents()} />
        </DocsBody>
      </DocsPage>
    );
  },
});

const apiClientLoader = browserCollections.api.createClientLoader({
  component({ toc, frontmatter, default: Mdx }) {
    return (
      <DocsPage toc={toc}>
        <title>{frontmatter.title}</title>
        <meta name="description" content={frontmatter.description} />
        <DocsTitle>{frontmatter.title}</DocsTitle>
        <DocsDescription>{frontmatter.description}</DocsDescription>
        <PageActions />
        <DocsBody>
          <Mdx components={useMDXComponents()} />
        </DocsBody>
      </DocsPage>
    );
  },
});

export default function Page({ loaderData }: Route.ComponentProps) {
  const { path, pageType, pageTree, markdownUrl, githubUrl } = useFumadocsLoader(loaderData);
  const clientLoader = pageType === "api" ? apiClientLoader : docsClientLoader;

  return (
    <DocsLayout {...baseOptions()} tree={pageTree}>
      <PageActionsContext.Provider value={{ markdownUrl, githubUrl }}>
        <Suspense>{clientLoader.useContent(path)}</Suspense>
      </PageActionsContext.Provider>
    </DocsLayout>
  );
}
