import { source } from "@/lib/source";
import { getLLMText } from "@/lib/get-llm-text";

import type { Route } from "./+types/llms-mdx";

export async function loader({ params }: Route.LoaderArgs) {
  const slugs = params["*"].split("/").filter((v) => v.length > 0);
  const page = source.getPage(slugs);
  if (!page) {
    return new Response("not found", { status: 404 });
  }

  return new Response(await getLLMText(page), {
    headers: {
      "Content-Type": "text/markdown",
    },
  });
}
