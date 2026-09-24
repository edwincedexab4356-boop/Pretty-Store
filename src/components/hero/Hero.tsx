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
    <section className="relative w-full overflow-hidden bg-slate-950 flex flex-col justify-center">
      {/* Background Video */}
      <BackgroundVideo videoUrl={videoUrl} />

      {/* Video Overlay */}
      <VideoOverlay />

      {/* Hero Content */}
      <HeroContent
        onExploreClick={onExploreClick}
        onCategoriesClick={onCategoriesClick}
      />
    </section>
  );
};
