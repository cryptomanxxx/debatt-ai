// Sätts automatiskt av Vercel vid deploy (NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA)
// Fallback: manuellt datum som uppdateras vid behov
export const BUILD_ID =
  process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ||
  "2026-05-26";
