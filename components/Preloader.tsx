'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

export default function Preloader() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time (e.g., 2.5 seconds)
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.8, ease: 'easeInOut' } }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999, // Ensure it's above absolutely everything
            background: 'var(--color-cream)', // Vintage background
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
          }}
        >
          {/* Logo Animation */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ 
              scale: [0.8, 1.1, 1],
              opacity: 1
            }}
            transition={{
              duration: 1.5,
              ease: "easeOut",
              times: [0, 0.6, 1],
              repeat: Infinity,
              repeatType: "reverse",
              repeatDelay: 0.2
            }}
            style={{ position: 'relative', width: 120, height: 120, marginBottom: '24px' }}
          >
            <Image
              src="/logo-v2.png"
              alt="Thirst. Logo"
              fill
              style={{ objectFit: 'contain' }}
              priority
            />
          </motion.div>
          
          {/* Text Animation */}
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            style={{
              fontFamily: 'var(--font-heading)',
              color: 'var(--color-plum)',
              fontSize: '2rem',
              letterSpacing: '2px',
              textTransform: 'uppercase'
            }}
          >
            Thirst<span style={{ color: 'var(--color-berry)' }}>.</span>
          </motion.h2>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
