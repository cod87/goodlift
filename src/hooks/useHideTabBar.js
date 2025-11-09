import { useEffect } from 'react';

/**
 * Hook to hide/show tab bar during workouts
 * Useful for maximizing screen space during active workout sessions
 * 
 * @param {boolean} isActive - Whether the workout is active
 * @param {string} tabBarId - ID of the tab bar element (default: 'bottom-navigation')
 */
export const useHideTabBar = (isActive, tabBarId = 'bottom-navigation') => {
  useEffect(() => {
    const tabBar = document.getElementById(tabBarId);
    
    if (!tabBar) return;

    if (isActive) {
      // Hide tab bar
      tabBar.style.transform = 'translateY(100%)';
      tabBar.style.transition = 'transform 0.3s ease-in-out';
    } else {
      // Show tab bar
      tabBar.style.transform = 'translateY(0)';
    }

    // Cleanup function to ensure tab bar is visible when component unmounts
    return () => {
      if (tabBar) {
        tabBar.style.transform = 'translateY(0)';
      }
    };
  }, [isActive, tabBarId]);
};

/**
 * Alternative implementation using CSS classes
 * More performant for frequent toggles
 * 
 * @param {boolean} isActive - Whether the workout is active
 */
export const useHideTabBarWithClass = (isActive) => {
  useEffect(() => {
    const body = document.body;
    
    if (isActive) {
      body.classList.add('hide-tab-bar');
    } else {
      body.classList.remove('hide-tab-bar');
    }

    // Cleanup
    return () => {
      body.classList.remove('hide-tab-bar');
    };
  }, [isActive]);
};
