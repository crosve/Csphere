import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  console.log("presigned url: ", url);

  if (!url) {
    return new Response("Missing url", { status: 400 });
  }

  const htmlRes = await fetch(url);
  const html = await htmlRes.text();

  return new Response(html, {
    headers: { "Content-Type": "text/html" },
  });
}
