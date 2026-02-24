import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");

  if (!q) {
    return Response.json({ error: "Missing query" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  const cx = process.env.GOOGLE_CX_ID;

  if (!apiKey || !cx) {
    return Response.json(
      { error: "Missing Google API credentials" },
      { status: 500 },
    );
  }

  const res = await fetch(
    `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(q)}`,
  );

  const data = await res.json();
  console.log("Full error response: ", JSON.stringify(data.error, null, 2));

  if (!res.ok) {
    return Response.json(
      { error: data.error?.message ?? "Search failed" },
      { status: res.status },
    );
  }

  return Response.json(data);
}
