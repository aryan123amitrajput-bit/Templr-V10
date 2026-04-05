import React, { useRef, useState, useEffect } from 'react';

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number; // Delay in ms
  staggerIndex?: number; // Index for list items to auto-calculate delay
  threshold?: number; // 0 to 1, how much of item must be visible
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({ 
  children, 
  className = "", 
  delay = 0, 
  staggerIndex = 0,
  threshold = 0.1 
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.unobserve(entry.target); // Only trigger once
      }
    }, { 
      threshold: threshold,
      rootMargin: '0px 0px -50px 0px' // Trigger slightly before it's fully in view
    });

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) observer.disconnect();
    };
  }, [threshold]);

  // Calculate stagger delay: base delay + (index * 100ms)
  // This creates the "one by one" effect
  const finalDelay = delay + (staggerIndex * 100);

  return (
    <div 
      ref={ref} 
      className={`${className} ${isVisible ? 'animate-reveal-blur opacity-100' : 'opacity-0'}`}
      style={{ animationDelay: `${finalDelay}ms`, animationFillMode: 'forwards' }}
    >
      {children}
    </div>
  );
};

export default ScrollReveal;