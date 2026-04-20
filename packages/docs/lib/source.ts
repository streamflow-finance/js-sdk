import { loader, multiple } from "fumadocs-core/source";

import { api, docs } from "@/.source/server";

export const source = loader(
  multiple({
    docs: docs.toFumadocsSource(),
    api: api.toFumadocsSource(),
  }),
  {
    baseUrl: "/docs",
  },
);
