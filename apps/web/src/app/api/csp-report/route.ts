import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.warn("[csp-report]", JSON.stringify(body));
  } catch {
    // malformed body — still return 204
  }
  return new Response(null, { status: 204 });
}
