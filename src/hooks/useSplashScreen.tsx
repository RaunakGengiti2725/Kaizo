import { useState, useEffect } from 'react';

export const useSplashScreen = () => {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Check if user has already seen the splash screen in this session
    const hasSeenSplash = sessionStorage.getItem('kaizo_splash_seen');
    
    if (hasSeenSplash === 'true') {
      setShowSplash(false);
    }
  }, []);

  const hideSplash = () => {
    setShowSplash(false);
    // Mark splash as seen for this session
    sessionStorage.setItem('kaizo_splash_seen', 'true');
  };

  return { showSplash, hideSplash };
};
