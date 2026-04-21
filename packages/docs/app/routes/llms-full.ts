import { source } from "@/lib/source";
import { getLLMText } from "@/lib/get-llm-text";

export async function loader() {
  const scan = source.getPages().map(getLLMText);
  const scanned = await Promise.all(scan);

  return new Response(scanned.join("\n\n"));
}
