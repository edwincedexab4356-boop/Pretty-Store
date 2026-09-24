import React from 'react';

export const VideoOverlay: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Subtle dark tint to ensure text contrast while keeping video vibrant */}
      <div className="absolute inset-0 bg-black/45" />

      {/* Gentle bottom blend into page background */}
      <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[#09090b] to-transparent" />

      {/* Subtle top shade for header legibility */}
      <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-black/60 to-transparent" />
    </div>
  );
};
