import React, { useState, useRef, useEffect } from 'react';
import './VideoBackground.css';

const VideoBackground = () => {
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.addEventListener('error', () => {
        console.error('Video failed to load');
        setVideoError(true);
      });
      
      // Попробуем перезагрузить видео
      video.load();
    }
  }, []);

  if (videoError) {
    return (
      <div className="video-background">
        <div className="fallback-background"></div>
      </div>
    );
  }

  return (
    <div className="video-background">
      <video 
        ref={videoRef}
        autoPlay 
        muted 
        loop 
        playsInline
        className="video-element"
        onError={() => setVideoError(true)}
      >
        <source src="/videos/bg-main.mp4" type="video/mp4" />
        <source src="./videos/bg-main.mp4" type="video/mp4" />
        <source src="videos/bg-main.mp4" type="video/mp4" />
      </video>
      <div className="video-overlay"></div>
    </div>
  );
};

export default VideoBackground;