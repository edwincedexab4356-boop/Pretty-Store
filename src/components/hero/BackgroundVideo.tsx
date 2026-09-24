import React, { useRef, useEffect, useState } from 'react';

interface BackgroundVideoProps {
  videoUrl?: string;
}

export const BackgroundVideo: React.FC<BackgroundVideoProps> = ({
  videoUrl = '/videos/hero.mp4',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentSrc, setCurrentSrc] = useState(videoUrl || '/videos/hero.mp4');

  useEffect(() => {
    if (videoUrl) {
      setCurrentSrc(videoUrl);
    }
  }, [videoUrl]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {});
    }
  }, [currentSrc]);

  const handleVideoError = () => {
    // If hero.mp4 fails, try the WhatsApp video fallback
    if (currentSrc === '/videos/hero.mp4') {
      setCurrentSrc('/videos/WhatsApp Video 2026-09-23 at 23.53.18.mp4');
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
