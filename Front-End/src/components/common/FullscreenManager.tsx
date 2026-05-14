import React, { useEffect } from 'react';

const FullscreenManager: React.FC = () => {
  useEffect(() => {
    // Check if it's mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

    if (!isMobile) return;

    const requestFullscreen = () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch((err) => {
          console.warn(`Error attempting to enable fullscreen: ${err.message}`);
        });
      }
      // Remove listeners after first attempt (whether successful or not)
      // because browsers usually only allow it once per gesture
      window.removeEventListener('click', requestFullscreen);
      window.removeEventListener('touchstart', requestFullscreen);
    };

    // Browsers require a user gesture to enter fullscreen
    // So we listen for the first click or touch
    window.addEventListener('click', requestFullscreen);
    window.addEventListener('touchstart', requestFullscreen);

    return () => {
      window.removeEventListener('click', requestFullscreen);
      window.removeEventListener('touchstart', requestFullscreen);
    };
  }, []);

  return null;
};

export default FullscreenManager;
