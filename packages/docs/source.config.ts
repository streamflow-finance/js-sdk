import { defineCollections, defineConfig, defineDocs, frontmatterSchema } from "fumadocs-mdx/config";

export const { docs, meta } = defineDocs({
  dir: "content/docs",
  docs: {
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
});

export const api = defineCollections({
  type: "doc",
  dir: "content/api",
  schema: frontmatterSchema,
  postprocess: {
    includeProcessedMarkdown: true,
  },
});

export default defineConfig({});
