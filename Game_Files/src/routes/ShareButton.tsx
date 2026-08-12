import React, { useState } from "react";

interface ShareToXButtonProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  userName?: string;
  builderTitle?: string;
}

export const ShareToXButton: React.FC<ShareToXButtonProps> = ({
  canvasRef,
  userName = "Builder",
  builderTitle = "Cosmic Architect",
}) => {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const showMsg = (msg: string, state: "success" | "error" | "loading" | "idle") => {
    setMessage(msg);
    setStatus(state);
    if (state !== "loading") setTimeout(() => setStatus("idle"), 4000);
  };

  const handleShare = async () => {
    if (!canvasRef.current) {
      return showMsg("Canvas not ready.", "error");
    }
    showMsg("Preparing ID...", "loading");

    const fileName = `HH_Goa_2026_${userName.replace(/\s+/g, "_")}.png`;
    const caption = `Just generated my official HH Goa 2026 Builder ID! 🌊✨\n\nName: ${userName}\nClass: ${builderTitle}`;
    const fullTweetText = `${caption}\n\n#FrameInGoa #HHGoa2026`;

    // 1. Export canvas to Blob safely
    let blob: Blob | null = null;
    try {
      blob = await new Promise<Blob | null>((resolve) =>
        canvasRef.current?.toBlob(resolve, "image/png")
      );
    } catch (err) {
      console.error("Canvas export failed:", err);
      return showMsg("❌ Canvas export failed.", "error");
    }

    if (!blob) return showMsg("Failed to process graphic.", "error");
    const file = new File([blob], fileName, { type: "image/png" });

    // 2. MOBILE: Use Native Web Share API if supported.
    // This is the ONLY path that attaches the actual file — the target app's
    // native share sheet receives the real file, not a link.
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: "HH Goa 2026 Builder ID",
          text: fullTweetText,
        });
        return showMsg("✓ Shared via App!", "success");
      } catch (err) {
        if ((err as Error).name === "AbortError") return setStatus("idle");
        // fall through to desktop path below if native share failed for
        // a reason other than the user cancelling
      }
    }

    // 3. DESKTOP (and mobile fallback): Twitter's web intent has NO parameter
    // for attaching a file directly — that capability simply doesn't exist
    // in the public intent API. The workaround is to host the image and pass
    // its page as `url=`; Twitter's crawler then unfurls that page's Open
    // Graph / Twitter Card meta tags into an inline image preview.
    try {
      const uploadForm = new FormData();
      uploadForm.append("image", file);

      const uploadRes = await fetch("/api/upload-card", {
        method: "POST",
        body: uploadForm,
      });

      if (!uploadRes.ok) {
        const bodyText = await uploadRes.text().catch(() => "");
        throw new Error(
          `Upload endpoint returned ${uploadRes.status}. ` +
          `Is /api/upload-card registered? (${bodyText.slice(0, 120)})`
        );
      }

      const uploadData = await uploadRes.json();
      if (!uploadData.cardUrl) {
        throw new Error(uploadData.error || "Upload failed");
      }

      // Also trigger a local download so the user keeps a copy regardless
      const dataUrl = canvasRef.current.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = fileName;
      link.href = dataUrl;
      link.click();

      // Copy tweet text to clipboard (best-effort, non-blocking)
      try {
        await navigator.clipboard.writeText(fullTweetText);
      } catch (e) {
        console.warn("Clipboard access denied", e);
      }

      // Open X Intent Composer. Twitter's intent only ever space-joins
      // separate text/url/hashtags params onto one line — there's no way
      // to control spacing between them that way. So we build the FULL
      // message ourselves, with our own line breaks, and pass it all as
      // a single `text` param. Twitter still auto-detects the URL inside
      // the text and generates the card preview from it.
      const fullText = `${caption}\n\n${uploadData.cardUrl}\n\n#FrameInGoa #HHGoa2026`;

      const xIntentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(fullText)}`;

      window.open(xIntentUrl, "_blank", "noopener,noreferrer");

      showMsg("✓ Ready — image link attached to your tweet!", "success");
    } catch (error) {
      console.error("Desktop share error:", error);
      showMsg("❌ Share failed.", "error");
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleShare}
        disabled={status === "loading"}
        className="flex items-center justify-center gap-2 px-6 py-3 bg-black hover:bg-neutral-900 disabled:opacity-50 text-white font-bold rounded-xl border border-cyan-400/50 shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all duration-200 cursor-pointer active:scale-95"
      >
        {status === "loading" ? (
          <span className="animate-spin text-cyan-400">🌀</span>
        ) : (
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        )}
        <span>{status === "loading" ? "Processing..." : "Share to X"}</span>
      </button>

      {message && (
        <span className={`text-xs animate-fade-in ${status === "error" ? "text-red-400" : "text-cyan-400"}`}>
          {message}
        </span>
      )}
    </div>
  );
};
