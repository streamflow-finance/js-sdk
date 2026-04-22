import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import mdx from "fumadocs-mdx/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import path from "node:path";
import { defineConfig } from "vite";

import * as MdxConfig from "./source.config";

export default defineConfig({
  plugins: [
    // ORDERING MATTERS: fumadocs-mdx must come BEFORE react-router, cloudflare BEFORE react-router
    mdx(MdxConfig),
    tailwindcss(),
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    reactRouter(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "app"),
      collections: path.resolve(__dirname, ".source"),
    },
  },
});
