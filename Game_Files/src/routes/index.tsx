import { createFileRoute } from "@tanstack/react-router";
import CyberGoaShooter from "@/components/CyberGoaShooter";

const title = "Sunset Runner — 16-bit Goa Cyber Shooter";
const description =
  "Pilot a neon Goan sailboat across a cyber-ocean sunset. Splash-fire at four neon crate buoys — and hunt the rare golden one.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="min-h-screen bg-background bg-grid flex flex-col items-center justify-center gap-6 px-4 py-8">
      <header className="text-center">
        <h1
          className="font-pixel text-base sm:text-2xl text-primary"
          style={{ textShadow: "4px 4px 0 #ff3d9a" }}
        >
          SUNSET RUNNER
        </h1>
        <p className="font-pixel pill-yellow mt-4 inline-block rounded-full px-4 py-2 text-[8px] sm:text-[10px]">
          GOA SUNSET // CYBER BAY
        </p>
      </header>

      <CyberGoaShooter />

      <p className="font-pixel text-[7px] sm:text-[9px] leading-5 text-muted-foreground text-center">
        BREAK ONE OF EACH CRATE TYPE TO WIN &middot; THE GOLD BUOY ENDS THE RUN
      </p>
    </main>
  );
}
