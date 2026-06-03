import { NextRequest } from "next/server";

const MAX_BODY_BYTES = 2048;

export async function POST(req: NextRequest) {
  const contentLength = Number(req.headers.get("content-length") ?? "0");
  if (contentLength > MAX_BODY_BYTES) {
    return new Response(null, { status: 413 });
  }
  try {
    const body = await req.json();
    console.warn("[csp-report]", JSON.stringify(body));
  } catch {
    // malformed body — still return 204
  }
  return new Response(null, { status: 204 });
}
