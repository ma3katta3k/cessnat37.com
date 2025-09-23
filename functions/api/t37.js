export async function onRequest({ request }) {
  const SHEET_CSV =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vRDLwnZkVXq1erye8LEWfFjqjYCNmZYuD5XC5jJ9EbnQv9jnSNrGPz7X-Wa7_5f-wvrpJMmjLN06aCn/pub?output=csv";

  // CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  // Fetch the CSV from Google; cache at the edge for 5 minutes
  const upstream = await fetch(SHEET_CSV, { cf: { cacheEverything: true, cacheTtl: 300 } });
  const body = await upstream.arrayBuffer();

  return new Response(body, {
    status: upstream.status,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Cache-Control": "public, max-age=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
