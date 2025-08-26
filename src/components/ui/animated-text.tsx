import { useState } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedTextProps {
  text: string;
  className?: string;
  delay?: number;
}

export const AnimatedText = ({ text, className, delay = 100 }: AnimatedTextProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <span
      className={cn("inline-flex", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {text.split('').map((letter, index) => (
        <span
          key={index}
          className={cn(
            "inline-block transition-transform duration-300 ease-out",
            isHovered && "animate-letter-bounce"
          )}
          style={{
            animationDelay: isHovered ? `${index * delay}ms` : '0ms',
            animationDuration: '600ms'
          }}
        >
          {letter}
        </span>
      ))}
    </span>
  );
};
