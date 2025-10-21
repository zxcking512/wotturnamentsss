import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './VideoBackground.css';

const VideoBackground = () => {
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.addEventListener('error', () => {
        console.error('Video failed to load');
        setVideoError(true);
      });
      
      video.load();
    }
  }, [location.pathname]);

  // Определяем какое видео использовать
  const isLoginPage = location.pathname === '/login';
  const videoSource = isLoginPage ? '/videos/bg-main_2.mp4' : '/videos/bg-main.mp4';

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
        key={videoSource}
      >
        <source src={videoSource} type="video/mp4" />
        <source src={`.${videoSource}`} type="video/mp4" />
        <source src={`videos/${isLoginPage ? 'bg-main_2.mp4' : 'bg-main.mp4'}`} type="video/mp4" />
      </video>
      <div className="video-overlay"></div>
    </div>
  );
};

export default VideoBackground;