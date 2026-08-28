import { textFileResponse } from "@/lib/textfile"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export function GET() {
  return textFileResponse("AGENTS.md", "text/markdown")
}
