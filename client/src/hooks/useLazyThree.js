/**
 * useLazyThree.js
 * Phase 8.2: Lazy-load Three.js components only when needed
 * 
 * Reduces initial bundle size by deferring Three.js imports
 * until PhysicsVisualization is actually rendered
 */

import { useEffect, useState, useRef } from 'react';

export function useLazyThree() {
  const [three, setThree] = useState(null);
  const [orbitControls, setOrbitControls] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    // Only load once
    if (loadedRef.current) return;
    loadedRef.current = true;

    const loadModules = async () => {
      try {
        // Dynamically import Three.js modules
        const threeModule = await import('three');
        const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');
        
        setThree(threeModule);
        setOrbitControls(() => OrbitControls);
        setIsLoaded(true);
      } catch (err) {
        setError(`Failed to load Three.js: ${err.message}`);
        console.error('Three.js lazy loading failed:', err);
      }
    };

    loadModules();
  }, []);

  return {
    three,
    OrbitControls: orbitControls,
    isLoaded,
    error
  };
}

export default useLazyThree;
