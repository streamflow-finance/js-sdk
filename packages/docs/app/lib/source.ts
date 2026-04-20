import { loader, multiple } from "fumadocs-core/source";
import { toFumadocsSource } from "fumadocs-mdx/runtime/server";

import { api, docs, meta } from "collections/server";

export const source = loader(
  multiple({
    docs: toFumadocsSource(docs, meta),
    api: toFumadocsSource(api, []),
  }),
  {
    baseUrl: "/docs",
  },
);
