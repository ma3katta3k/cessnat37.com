mkdir -p functions
cat > functions/healthcheck.js <<'EOF'
export function onRequest() {
  return new Response("ok", {
    headers: { "Access-Control-Allow-Origin": "*" }
  });
}
EOF