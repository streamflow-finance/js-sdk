import { loader } from "fumadocs-core/source";
import { toFumadocsSource } from "fumadocs-mdx/runtime/server";
import { createElement } from "react";
import { icons } from "lucide-react";

import { docs, meta } from "collections/server";

export const source = loader(toFumadocsSource(docs, meta), {
  baseUrl: "/docs",
  icon(icon) {
    if (!icon) return;
    if (icon in icons) return createElement(icons[icon as keyof typeof icons]);
  },
});
