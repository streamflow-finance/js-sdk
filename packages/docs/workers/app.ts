import { createRequestHandler, createContext, RouterContextProvider } from "react-router";

interface CloudflareContext {
  env: Env;
  ctx: ExecutionContext;
}

const cloudflareContext = createContext<CloudflareContext>();

declare module "react-router" {
  interface AppLoadContext {
    cloudflare: CloudflareContext;
  }
}

const requestHandler = createRequestHandler(() => import("virtual:react-router/server-build"), import.meta.env.MODE);

export default {
  async fetch(request, env, ctx) {
    const loadContext = new RouterContextProvider(new Map([[cloudflareContext, { env, ctx }]]));

    return requestHandler(request, loadContext);
  },
} satisfies ExportedHandler<Env>;
