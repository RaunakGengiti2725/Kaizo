import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const useSlideTransition = () => {
  const [isSliding, setIsSliding] = useState(false);
  const navigate = useNavigate();

  const slideToPage = (path: string) => {
    setIsSliding(true);
    
    setTimeout(() => {
      navigate(path);
      setIsSliding(false);
    }, 150);
  };

  return { isSliding, slideToPage };
};
