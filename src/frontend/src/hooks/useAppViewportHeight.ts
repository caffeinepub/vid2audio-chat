import { useEffect } from 'react';

/**
 * Hook that updates a CSS custom property with the actual viewport height
 * to handle mobile browser UI changes (address bar showing/hiding).
 */
export function useAppViewportHeight() {
  useEffect(() => {
    const updateHeight = () => {
      // Set CSS custom property to actual viewport height
      document.documentElement.style.setProperty(
        '--app-height',
        `${window.innerHeight}px`
      );
    };

    // Set initial height
    updateHeight();

    // Update on resize and orientation change
    window.addEventListener('resize', updateHeight);
    window.addEventListener('orientationchange', updateHeight);

    return () => {
      window.removeEventListener('resize', updateHeight);
      window.removeEventListener('orientationchange', updateHeight);
    };
  }, []);
}
