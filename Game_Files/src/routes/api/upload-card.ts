import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/upload-card")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const formData = await request.formData();
          const file = formData.get("image") as File;

          if (!file) {
            return new Response(JSON.stringify({ error: "No image provided" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const apiKey = process.env["IMGBB_API_KEY"];
          if (!apiKey) {
            return new Response(JSON.stringify({ error: "ImgBB API key missing" }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            });
          }

          const imgbbData = new FormData();
          imgbbData.append("image", file);

          // Upload to ImgBB (Auto-expires in 30 days)
          const imgbbRes = await fetch(
            `https://api.imgbb.com/1/upload?key=${apiKey}&expiration=2592000`,
            {
              method: "POST",
              body: imgbbData,
            },
          );

          const data = await imgbbRes.json();

          if (!data.success) {
            return new Response(JSON.stringify({ error: "ImgBB upload failed" }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            });
          }

          const imageUrl = data.data.url;
          const fileId = data.data.id;
          const imgWidth = data.data.width;
          const imgHeight = data.data.height;

          // Prefer an explicit public origin (set this to your ngrok/tunnel
          // URL while testing locally, and to your real domain in prod).
          // Falling back to request.url's origin means Twitter's crawler
          // will get a `localhost` URL it can never reach — which is why
          // the card silently fails to unfurl during local dev.
          const origin = process.env["PUBLIC_ORIGIN"] || new URL(request.url).origin;
          const baseCardUrl =
            `${origin}/card/${fileId}` +
            `?img=${encodeURIComponent(imageUrl)}` +
            (imgWidth ? `&w=${imgWidth}` : "") +
            (imgHeight ? `&h=${imgHeight}` : "");
          // Append the url as its own param ("u") so the route can read its
          // own canonical address back out inside head() — head() has no
          // access to window or the incoming request, so this is the only
          // reliable way to give it a real og:url without hardcoding a domain.
          const cardUrl = `${baseCardUrl}&u=${encodeURIComponent(baseCardUrl)}`;

          return new Response(JSON.stringify({ cardUrl, imageUrl }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (error) {
          console.error("API Error:", error);
          return new Response(JSON.stringify({ error: "Server error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
