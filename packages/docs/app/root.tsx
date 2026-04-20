import { Links, Meta, Scripts, ScrollRestoration } from "react-router";
import { RootProvider } from "fumadocs-ui/provider/react-router";
import { rewritePath } from "fumadocs-core/negotiation";
import "./app.css";
import type { Route } from "./+types/root";
import type { ReactNode } from "react";

// LLMs middleware: rewrite /docs/{path}.mdx → /llms.mdx/docs/{path}
const { rewrite: rewriteLLM } = rewritePath("/docs{/*path}.mdx", "/llms.mdx/docs{/*path}");

const serverMiddleware: Route.MiddlewareFunction = async ({ request }, next) => {
  const url = new URL(request.url);
  const path = rewriteLLM(url.pathname);
  if (path) return Response.redirect(new URL(path, url));

  return next();
};

export const middleware = [serverMiddleware];

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="flex flex-col min-h-screen">
        <RootProvider>{children}</RootProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
