import React, { useRef, useEffect } from 'react';

interface BackgroundVideoProps {
  videoUrl?: string;
  posterUrl?: string;
}

export const BackgroundVideo: React.FC<BackgroundVideoProps> = ({
  videoUrl = '',
  posterUrl = '',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && videoUrl) {
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {});
    }
  }, [videoUrl]);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-slate-950 pointer-events-none">
      {/* Real Background HTML5 Video configured by the user */}
      {videoUrl ? (
        <video
          ref={videoRef}
          src={videoUrl}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover scale-105 transform motion-safe:transition-transform"
        />
      ) : null}
    </div>
  );
};
