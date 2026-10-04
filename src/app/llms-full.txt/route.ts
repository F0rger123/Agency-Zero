import { llmsFull } from "@/lib/llms";

export const dynamic = "force-static";

export function GET() {
  return new Response(llmsFull(), { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
