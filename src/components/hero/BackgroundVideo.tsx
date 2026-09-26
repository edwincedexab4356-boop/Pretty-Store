import React, { useRef, useEffect, useState } from 'react';

interface BackgroundVideoProps {
  videoUrl?: string;
}

const OFFICIAL_VIDEO_PATH = '/videos/WhatsApp Video 2026-09-26 at 15.05.22.mp4';

export const BackgroundVideo: React.FC<BackgroundVideoProps> = ({
  videoUrl = '/videos/hero.mp4',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const resolveSrc = (url?: string) => {
    if (!url || url.includes('2026-09-23')) {
      return OFFICIAL_VIDEO_PATH;
    }
    return url;
  };

  const [currentSrc, setCurrentSrc] = useState(() => resolveSrc(videoUrl));

  useEffect(() => {
    setCurrentSrc(resolveSrc(videoUrl));
  }, [videoUrl]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {});
    }
  }, [currentSrc]);

  const handleVideoError = () => {
    if (currentSrc !== '/videos/hero.mp4') {
      setCurrentSrc('/videos/hero.mp4');
    } else {
      setCurrentSrc(OFFICIAL_VIDEO_PATH);
    }
  };

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-black pointer-events-none">
      <video
        ref={videoRef}
        src={currentSrc}
        autoPlay
        loop
        muted
        playsInline
        onError={handleVideoError}
        className="absolute inset-0 w-full h-full object-cover object-center"
      />
    </div>
  );
};
