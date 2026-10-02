import { useEffect, useRef } from "react";
import {motion}  from "framer-motion";
const HERO_VIDEO_SRC = "/images/hero-video-1.mp4";
const HERO_VIDEO_POSTER: string | undefined = undefined;
const EASE = [0.22, 1, 0.36, 1] as const;

export default function HeroVideo({ reduceMotion }: { reduceMotion: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (reduceMotion) {
      video.pause();
    } else {
      video.muted = true;
      video.play().catch(() => {});
    }
  }, [reduceMotion]);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden opacity-80">
      {/* Video, fading in once it can play so it never flashes black */}
      <motion.video
        ref={videoRef}
        src={HERO_VIDEO_SRC}
        poster={HERO_VIDEO_POSTER}
        autoPlay={!reduceMotion}
        muted
        loop
        playsInline
        webkit-playsinline="true"
        preload="auto"
        initial={{ opacity: 0, scale: 1.08 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.8, ease: EASE }}
        className="absolute inset-0 h-full w-full object-cover"
      />
    </div>
  );
}