import { NextResponse } from 'next/server';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  const html = `
    <!DOCTYPE html>
    <html>
    <head><title>GitHub Auth</title></head>
    <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #0d1117; color: white;">
      <p>Authenticating with GitHub, please wait...</p>
      <script>
        if (window.opener) {
          window.opener.postMessage({
            type: 'github-oauth-callback',
            code: ${code ? `'${code}'` : 'null'},
            error: ${error ? `'${error}'` : 'null'},
          }, window.location.origin);
          window.close();
        } else {
          document.body.innerHTML = '<p>Authentication complete. You can close this window.</p>';
        }
      </script>
    </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}
