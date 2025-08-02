import { useState, useEffect, useRef, useCallback } from 'react';

interface ResponsiveNavigationOptions {
  menuItems?: number;
  minSpaceRequired?: number;
  debounceDelay?: number;
}

/**
 * Hook that determines when to show hamburger menu based on available space
 * rather than just screen size. This ensures navigation always fits properly.
 */
export function useResponsiveNavigation(options: ResponsiveNavigationOptions = {}) {
  const {
    menuItems = 6, // Estimated number of menu items
    minSpaceRequired = 800, // Minimum space needed for full navigation
    debounceDelay = 100
  } = options;

  const [shouldShowHamburger, setShouldShowHamburger] = useState(false);
  const [availableWidth, setAvailableWidth] = useState(0);
  const headerRef = useRef<HTMLElement>(null);

  const calculateAvailableSpace = useCallback(() => {
    if (!headerRef.current) return;

    const header = headerRef.current;
    const headerWidth = header.offsetWidth;
    
    // Calculate space taken by logo, search, and right-side elements
    const logoElement = header.querySelector('[data-nav-logo]');
    const searchElement = header.querySelector('[data-nav-search]');
    const actionsElement = header.querySelector('[data-nav-actions]');
    
    const logoWidth = logoElement?.getBoundingClientRect().width || 120;
    const searchWidth = searchElement?.getBoundingClientRect().width || 300;
    const actionsWidth = actionsElement?.getBoundingClientRect().width || 200;
    
    // Add padding and margins
    const reservedSpace = logoWidth + searchWidth + actionsWidth + 120; // 120px for margins/padding
    const availableForNavigation = headerWidth - reservedSpace;
    
    setAvailableWidth(availableForNavigation);
    
    // Estimate space needed for navigation items
    const estimatedNavWidth = menuItems * 140; // ~140px per nav item with padding
    
    setShouldShowHamburger(availableForNavigation < estimatedNavWidth);
  }, [menuItems]);

  const debouncedCalculate = useCallback(() => {
    const timeoutId = setTimeout(calculateAvailableSpace, debounceDelay);
    return () => clearTimeout(timeoutId);
  }, [calculateAvailableSpace, debounceDelay]);

  useEffect(() => {
    // Initial calculation
    calculateAvailableSpace();

    // Create ResizeObserver for more accurate monitoring
    const resizeObserver = new ResizeObserver(() => {
      debouncedCalculate();
    });

    // Observe the header element
    if (headerRef.current) {
      resizeObserver.observe(headerRef.current);
    }

    // Fallback to window resize for older browsers
    const handleResize = () => {
      debouncedCalculate();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [debouncedCalculate]);

  return {
    shouldShowHamburger,
    availableWidth,
    headerRef,
    recalculate: calculateAvailableSpace
  };
}