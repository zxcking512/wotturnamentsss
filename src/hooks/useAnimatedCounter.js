import { useState, useEffect, useRef } from 'react';

const useAnimatedCounter = (targetValue, duration = 1000) => {
  const [currentValue, setCurrentValue] = useState(0);
  const previousValueRef = useRef(0);
  const animationRef = useRef(null);

  useEffect(() => {
    const startValue = previousValueRef.current;
    const endValue = targetValue;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // easing function для плавности
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const value = startValue + (endValue - startValue) * easeOutQuart;

      setCurrentValue(Math.floor(value));

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setCurrentValue(endValue);
        previousValueRef.current = endValue;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [targetValue, duration]);

  return currentValue;
};

export default useAnimatedCounter;