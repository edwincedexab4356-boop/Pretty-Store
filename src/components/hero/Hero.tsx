import React from 'react';
import { BackgroundVideo } from './BackgroundVideo';
import { VideoOverlay } from './VideoOverlay';
import { HeroContent } from './HeroContent';

interface HeroProps {
  videoUrl?: string;
  onExploreClick: () => void;
  onCategoriesClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  videoUrl,
  onExploreClick,
  onCategoriesClick,
}) => {
  return (
    <section className="relative w-full min-h-[85vh] sm:min-h-[90vh] overflow-hidden bg-black flex flex-col justify-center">
      {/* Background Video */}
      <BackgroundVideo videoUrl={videoUrl} />

      {/* Subtle Video Overlay */}
      <VideoOverlay />

      {/* Cinematic Minimal Hero Content */}
      <HeroContent
        onExploreClick={onExploreClick}
        onCategoriesClick={onCategoriesClick}
      />
    </section>
  );
};
