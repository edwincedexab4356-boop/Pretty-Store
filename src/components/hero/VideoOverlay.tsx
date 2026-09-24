import React from 'react';

export const VideoOverlay: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Light tint for contrast */}
      <div className="absolute inset-0 bg-slate-950/40 backdrop-contrast-115" />

      {/* Subtle radial vignette emphasizing center */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_25%,rgba(2,6,23,0.6)_100%)]" />

      {/* Bottom smooth gradient blend into content */}
      <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-slate-950 to-transparent" />

      {/* Top subtle gradient for header readability */}
      <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-slate-950/70 to-transparent" />
    </div>
  );
};
