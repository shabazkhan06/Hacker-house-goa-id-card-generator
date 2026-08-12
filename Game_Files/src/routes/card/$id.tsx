import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/card/$id")({
  // Properly type and validate the ?img=, ?w=, ?h=, ?u= URL parameters
  validateSearch: (search: Record<string, unknown>) => {
    return {
      img: (search["img"] as string) || undefined,
      w: search["w"] ? Number(search["w"]) : undefined,
      h: search["h"] ? Number(search["h"]) : undefined,
      u: (search["u"] as string) || undefined,
    };
  },

  loaderDeps: ({ search }) => ({ img: search.img, w: search.w, h: search.h, u: search.u }),
  loader: async ({ deps }) => deps,

  // Emit Open Graph + Twitter Card meta tags. Twitter's crawler reads THIS
  // static head — it does not execute your React component — so without
  // these tags there is nothing for it to unfurl, regardless of what the
  // page visually renders client-side.
  head: ({ loaderData }) => {
    const img = loaderData?.img;
    const w = loaderData?.w;
    const h = loaderData?.h;
    const canonicalUrl = loaderData?.u;
    const title = "HH Goa 2026 Builder ID";
    const description = "My official HH Goa 2026 Builder ID card.";

    return {
      meta: [
        { title },
        { name: "description", content: description },
        // Open Graph (used by most platforms, and as Twitter's fallback)
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        // Explicit canonical URL — without this, some clients fall back to
        // whatever they infer as the "primary content" of the page (which,
        // for a page that's mostly just an <img>, can end up being the raw
        // image URL itself instead of this page). Passed through as a
        // query param from upload-card.ts since head() has no access to
        // window or the request here.
        ...(canonicalUrl ? [{ property: "og:url", content: canonicalUrl }] : []),
        ...(img ? [{ property: "og:image", content: img }] : []),
        ...(img ? [{ property: "og:image:secure_url", content: img }] : []),
        ...(img ? [{ property: "og:image:type", content: "image/png" }] : []),
        ...(w ? [{ property: "og:image:width", content: String(w) }] : []),
        ...(h ? [{ property: "og:image:height", content: String(h) }] : []),
        { property: "og:image:alt", content: title },
        // Twitter-specific — summary_large_image is what gives the big
        // inline photo instead of a small thumbnail. Twitter has become
        // stricter about wanting width/height alongside the image to
        // reliably render the large layout instead of silently falling
        // back to a generic placeholder.
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        ...(img ? [{ name: "twitter:image", content: img }] : []),
        { name: "twitter:image:alt", content: title },
      ],
    };
  },

  component: CardPreviewPage,
});

function CardPreviewPage() {
  // useSearch automatically knows 'img' exists because of validateSearch above
  const { img } = Route.useSearch();

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-4">
        <h1 className="text-2xl font-bold text-cyan-400">HH Goa 2026 Builder ID</h1>
        {img && (
          <img
            src={img}
            alt="Builder ID Card"
            className="w-full h-auto rounded-xl border border-cyan-500/30 shadow-[0_0_25px_rgba(34,211,238,0.2)]"
          />
        )}
      </div>
    </main>
  );
}
