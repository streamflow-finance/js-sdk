import { defineCollections, defineConfig, defineDocs, frontmatterSchema } from "fumadocs-mdx/config";

export const { docs, meta } = defineDocs({
  dir: "content/docs",
});

export const api = defineCollections({
  type: "doc",
  dir: "content/api",
  schema: frontmatterSchema,
});

export default defineConfig({});
