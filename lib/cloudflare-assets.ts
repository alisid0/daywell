type Assets = { fetch(request: Request): Promise<Response> };

/** Called only after Access verification. Serve the uploaded files directly:
 * framework route discovery must not decide whether a CSS/JS/audio file exists.
 */
export async function servePrivateAssets(
  request: Request,
  assets: Assets | undefined,
  next: (request: Request) => Promise<Response>,
) {
  const path = new URL(request.url).pathname;
  if (assets && (request.method === "GET" || request.method === "HEAD") && path !== "/api" && !path.startsWith("/api/")) {
    const response = await assets.fetch(request);
    if (response.status !== 404) return response;
    await response.body?.cancel();
  }
  return next(request);
}
