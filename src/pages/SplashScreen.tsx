import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import KaizoLogo from '@/assets/Kaizo.png';

interface SplashScreenProps {
  onEnter: () => void;
}

const TapHint = ({ position, delay = 0 }: { position: { top?: string; bottom?: string; left?: string; right?: string }, delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.85 }}
    animate={{ 
      opacity: [0, 0.85, 0.85, 0],
      scale: [0.85, 1, 1, 0.85]
    }}
    transition={{ 
      duration: 2.2,
      times: [0, 0.3, 0.7, 1],
      repeat: Infinity,
      repeatDelay: 1.6,
      delay
    }}
    className="absolute z-[101] pointer-events-none"
    style={position}
  >
    <div className="flex flex-col items-center space-y-1">
      {/* Small animated circle */}
      <motion.div
        animate={{ 
          scale: [1, 1.18, 1],
          opacity: [0.6, 1, 0.6]
        }}
        transition={{ 
          duration: 1.3,
          repeat: Infinity,
          ease: "easeInOut",
          delay
        }}
        className="w-8 h-8 rounded-full border-2 border-emerald-600/60 dark:border-white/40 flex items-center justify-center bg-emerald-500/10 dark:bg-white/10 backdrop-blur-[2px] drop-shadow-sm"
      >
        <motion.div
          animate={{ scale: [0.85, 1, 0.85] }}
          transition={{ 
            duration: 1.3,
            repeat: Infinity,
            ease: "easeInOut",
            delay
          }}
          className="w-3 h-3 rounded-full bg-emerald-600/80 dark:bg-white/70"
        />
      </motion.div>
      
      {/* Small text */}
      <motion.p
        animate={{ opacity: [0.55, 0.9, 0.55] }}
        transition={{ 
          duration: 1.3,
          repeat: Infinity,
          ease: "easeInOut",
          delay
        }}
        className="text-[11px] text-emerald-800/80 dark:text-white/75 font-medium"
      >
        Tap to enter
      </motion.p>
    </div>
  </motion.div>
);

const SplashScreen = ({ onEnter }: SplashScreenProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [showTapHints, setShowTapHints] = useState(false);

  useEffect(() => {
    // Show tap hints shortly after logo animates in
    const timer = setTimeout(() => {
      setShowTapHints(true);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  const handleEnter = () => {
    setIsVisible(false);
    // Delay the onEnter callback to allow exit animation
    setTimeout(() => {
      onEnter();
    }, 600);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] cursor-pointer"
          onClick={handleEnter}
        >
          {/* Clean Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-emerald-900" />

          {/* Content Container */}
          <div className="relative flex flex-col items-center justify-center min-h-screen px-4">
            {/* Logo Container */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ 
                duration: 0.8, 
                ease: "easeOut",
                type: "spring",
                stiffness: 120,
                damping: 20
              }}
              className="relative mb-8"
            >
              {/* Simple Glow */}
              <div className="absolute inset-0 rounded-3xl bg-green-400/20 blur-2xl scale-110" />
              
              {/* Logo */}
              <div className="relative bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl">
                <img
                  src={KaizoLogo}
                  alt="Kaizo Logo"
                  className="w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 object-contain"
                />
              </div>
            </motion.div>

            {/* Brand Name */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-center"
            >
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 dark:from-green-400 dark:via-emerald-400 dark:to-teal-400 bg-clip-text text-transparent mb-4">
                Kaizo
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 font-medium">
                Your Smart Vegan Companion
              </p>
            </motion.div>

            {/* Small Animated Tap Hints */}
            <AnimatePresence>
              {showTapHints && (
                <>
                  {/* Top Left */}
                  <TapHint position={{ top: '12%', left: '8%' }} delay={0} />
                  
                  {/* Top Right */}
                  <TapHint position={{ top: '12%', right: '8%' }} delay={0.8} />

                  {/* Bottom Left */}
                  <TapHint position={{ bottom: '12%', left: '8%' }} delay={1.6} />

                  {/* Bottom Right */}
                  <TapHint position={{ bottom: '12%', right: '8%' }} delay={2.4} />

                  {/* Center Bottom - slightly larger */}
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ 
                      opacity: [0, 0.8, 0.8, 0],
                      y: 0,
                      scale: [0.9, 1.1, 1.1, 0.9]
                    }}
                    transition={{ 
                      duration: 2.5,
                      times: [0, 0.3, 0.7, 1],
                      repeat: Infinity,
                      repeatDelay: 2,
                      delay: 3.2
                    }}
                    className="absolute bottom-8 left-1/2 transform -translate-x-1/2 pointer-events-none"
                  >
                    <div className="flex flex-col items-center space-y-2">
                      {/* Slightly larger circle for center */}
                      <motion.div
                        animate={{ 
                          scale: [1, 1.3, 1],
                          opacity: [0.7, 1, 0.7]
                        }}
                        transition={{ 
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: 3.2
                        }}
                        className="w-10 h-10 rounded-full border-2 border-white/50 flex items-center justify-center bg-white/15 backdrop-blur-sm"
                      >
                        <motion.div
                          animate={{ scale: [0.8, 1, 0.8] }}
                          transition={{ 
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: 3.2
                          }}
                          className="w-4 h-4 rounded-full bg-white/70"
                        />
                      </motion.div>
                      
                      <motion.p
                        animate={{ opacity: [0.6, 0.9, 0.6] }}
                        transition={{ 
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: 3.2
                        }}
                        className="text-sm text-white/70 font-medium"
                      >
                        Tap to enter
                      </motion.p>
                    </div>
                  </motion.div>

                  {/* Left Side */}
                  <TapHint position={{ top: '45%', left: '4%' }} delay={4} />

                  {/* Right Side */}
                  <TapHint position={{ top: '45%', right: '4%' }} delay={4.8} />
                </>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
