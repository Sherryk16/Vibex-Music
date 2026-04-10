"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function DownloadContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const videoId = searchParams.get("id");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!videoId) {
      router.push("/");
    }
  }, [videoId, router]);

  if (!videoId) return null;

  const downloadUrl = `https://y2mate.ws/watch?v=${videoId}`;

  return (
    <div className="min-h-screen bg-surface-container-lowest">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-surface-container/95 backdrop-blur-xl border-b border-outline-variant/15 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="font-headline text-xl font-bold text-on-surface">Download Music</h1>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 rounded-full bg-primary text-on-primary font-bold hover:scale-105 active:scale-95 transition-all"
          >
            Back to VibeX
          </button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center pt-20">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
            <p className="text-on-surface-variant">Loading download page...</p>
          </div>
        </div>
      )}

      {/* Iframe */}
      <iframe
        src={downloadUrl}
        className="w-full h-screen pt-20"
        onLoad={() => setIsLoading(false)}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-downloads"
      />
    </div>
  );
}

export default function DownloadPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-surface-container-lowest">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    }>
      <DownloadContent />
    </Suspense>
  );
}
