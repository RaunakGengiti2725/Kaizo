import { useState, useEffect, useRef } from 'react';

export const useScrollAnimation = (threshold = 0.1) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          setHasAnimated(true);
        } else {
          setIsVisible(false);
          setHasAnimated(false);
        }
      },
      {
        threshold,
        rootMargin: '0px 0px -200px 0px'
      }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    // Fallback scroll listener for fullscreen compatibility
    const handleScroll = () => {
      if (currentRef) {
        const rect = currentRef.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const isInView = rect.top < windowHeight * 0.8 && rect.bottom > 0;
        
        if (isInView && !isVisible) {
          setIsVisible(true);
          setHasAnimated(true);
        } else if (!isInView && isVisible) {
          setIsVisible(false);
          setHasAnimated(false);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial state

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
      window.removeEventListener('scroll', handleScroll);
    };
  }, [threshold, isVisible]);

  return { ref, isVisible, hasAnimated };
};
