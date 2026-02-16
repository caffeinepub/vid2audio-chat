import { useEffect, useRef, useState, useCallback } from 'react';

interface UseChatAutoScrollOptions {
  /**
   * Threshold in pixels from bottom to consider "near bottom"
   */
  threshold?: number;
  /**
   * Dependencies that trigger auto-scroll check (e.g., job count)
   */
  dependencies?: unknown[];
}

/**
 * Hook that manages auto-scroll behavior for a chat thread:
 * - Tracks whether user is near the bottom
 * - Auto-scrolls to bottom when new content arrives (only if already near bottom)
 * - Provides manual scroll-to-bottom function
 */
export function useChatAutoScroll({
  threshold = 100,
  dependencies = [],
}: UseChatAutoScrollOptions = {}) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  // Check if scroll position is near bottom
  const checkIfNearBottom = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return false;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    return distanceFromBottom <= threshold;
  }, [threshold]);

  // Scroll to bottom smoothly
  const scrollToBottom = useCallback((smooth = true) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto',
    });
    setShouldAutoScroll(true);
    setIsNearBottom(true);
  }, []);

  // Handle scroll events
  const handleScroll = useCallback(() => {
    const nearBottom = checkIfNearBottom();
    setIsNearBottom(nearBottom);
    setShouldAutoScroll(nearBottom);
  }, [checkIfNearBottom]);

  // Auto-scroll when content changes (only if user is near bottom)
  useEffect(() => {
    if (shouldAutoScroll && scrollContainerRef.current) {
      // Use requestAnimationFrame to ensure DOM has updated
      requestAnimationFrame(() => {
        scrollToBottom(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return {
    scrollContainerRef,
    isNearBottom,
    scrollToBottom,
    handleScroll,
  };
}
