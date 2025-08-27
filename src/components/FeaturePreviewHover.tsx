import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Scan, ChefHat, MapPin, MousePointer2, Pause, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const srOnly = 'sr-only';

const FeaturePreviewHover = () => {
  const prefersReducedMotion = useReducedMotion();
  const [open] = useState(true); // always open; no hover needed
  const [step, setStep] = useState(0); // 0: idle, 1..3 features
  const [paused, setPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const steps = useMemo(() => ([
    {
      key: 'scan',
      icon: Scan,
      title: 'Scan Products',
      subtitle: 'Vegan detected!'
    },
    {
      key: 'recipes',
      icon: ChefHat,
      title: 'Find Recipes',
      subtitle: 'Recipes found!'
    },
    {
      key: 'restaurants',
      icon: MapPin,
      title: 'Restaurants',
      subtitle: 'Found nearby!'
    }
  ]), []);

  // cycle through steps when open
  useEffect(() => {
    if (!open || paused) return;
    setStep(1);
    let i = 1;
    const interval = setInterval(() => {
      i = i >= 3 ? 1 : i + 1;
      setStep(i);
    }, 2200);
    return () => clearInterval(interval);
  }, [open, paused]);

  const handleEnter = () => {};
  const handleLeave = () => {};

  const cursorVariants = prefersReducedMotion ? {} : {
    pulse: {
      scale: [1, 1.08, 1],
      opacity: [0.7, 1, 0.7],
      transition: { duration: 1.6, repeat: Infinity, ease: "easeInOut" as const }
    }
  };

  const scanLineVariants = prefersReducedMotion ? {} : {
    sweep: {
      left: ['-4px', 'calc(100% + 4px)'],
      transition: { duration: 1.2, repeat: Infinity, ease: "easeInOut" as const }
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-[500px] rounded-3xl bg-gradient-to-br from-emerald-50 to-green-100 dark:from-gray-800 dark:to-gray-700 shadow-2xl overflow-hidden focus:outline-none flex items-center justify-center"
      tabIndex={0}
      role="region"
      aria-label="Feature preview. Hover or focus to see Kaizo features."
    >
      {/* Abstract flowing lines behind the white container */}
      <motion.div
        className="absolute w-32 h-px bg-emerald-300/40 dark:bg-emerald-600/40 rounded-full"
        animate={{
          x: ['-100%', '100%'],
          y: ['20%', '80%', '20%'],
          opacity: [0, 0.6, 0]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{ top: '25%' }}
      />
      <motion.div
        className="absolute w-24 h-px bg-emerald-400/30 dark:bg-emerald-500/30 rounded-full"
        animate={{
          x: ['100%', '-100%'],
          y: ['70%', '30%', '70%'],
          opacity: [0, 0.5, 0]
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
        style={{ top: '65%' }}
      />
      
      {/* Tooltip / floating card */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.25 }}
            className="w-[95%] max-w-[800px] rounded-2xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border border-emerald-200/60 dark:border-emerald-800/60 shadow-xl z-10"
            role="dialog"
            aria-live="polite"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-emerald-100/60 dark:divide-emerald-800/60">
              {/* SCAN */}
              <div className={`p-6 h-[200px] flex flex-col ${step === 1 ? 'bg-emerald-50/50 dark:bg-emerald-900/20' : ''}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Scan className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold">Scan Products</span>
                </div>
                <div className="relative h-16 rounded-md bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  {/* fake label */}
                  <div className="absolute inset-0 text-[10px] text-gray-600 dark:text-gray-300 p-2 opacity-80">
                    Ingredients: water, chickpeas, sea salt, citric acid
                  </div>
                  {/* scan line */}
                  <AnimatePresence>
                    {step === 1 && (
                      <motion.div 
                        className="absolute top-0 bottom-0 w-1 bg-emerald-500/70" 
                        style={{ left: '-4px' }}
                        variants={scanLineVariants} 
                        animate="sweep"
                        exit={{ opacity: 0 }}
                      />
                    )}
                  </AnimatePresence>
                </div>
                {/* check - positioned below the content box */}
                <div className="h-6 flex items-center">
                  <AnimatePresence>
                    {step === 1 && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="text-emerald-600 text-xs font-semibold">
                        ✓ Vegan detected!
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="mt-auto">
                  <Link to="/scan"><Button size="sm" variant="outline">Try Scanning</Button></Link>
                </div>
              </div>

              {/* RECIPES */}
              <div className={`p-6 h-[200px] flex flex-col ${step === 2 ? 'bg-emerald-50/50 dark:bg-emerald-900/20' : ''}`}>
                <div className="flex items-center gap-2 mb-2">
                  <ChefHat className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold">Find Recipes</span>
                </div>
                <div className="relative h-16 rounded-md bg-gray-100 dark:bg-gray-800 overflow-hidden p-2">
                  {/* ingredient chips as non-overlapping row */}
                  <div className="flex flex-wrap items-center gap-2">
                    <motion.span className="text-xs px-2 py-0.5 rounded-full bg-white/80 dark:bg-gray-700/70 whitespace-nowrap"
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: step === 2 ? 0 : -20, opacity: step === 2 ? 1 : 0 }}>
                      Tofu
                    </motion.span>
                    <motion.span className="text-xs px-2 py-0.5 rounded-full bg-white/80 dark:bg-gray-700/70 whitespace-nowrap"
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: step === 2 ? 0 : -20, opacity: step === 2 ? 1 : 0 }}
                      transition={{ delay: 0.15 }}>
                      Spinach
                    </motion.span>
                    <motion.span className="text-xs px-2 py-0.5 rounded-full bg-white/80 dark:bg-gray-700/70 whitespace-nowrap"
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: step === 2 ? 0 : -20, opacity: step === 2 ? 1 : 0 }}
                      transition={{ delay: 0.3 }}>
                      Garlic
                    </motion.span>
                  </div>
                </div>
                {/* message - positioned below the content box */}
                <div className="h-6 flex items-center">
                  <AnimatePresence>
                    {step === 2 && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-emerald-600 text-xs font-semibold">
                        ✨ Recipes found!
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="mt-auto">
                  <Link to="/recipes"><Button size="sm" variant="outline">Browse Recipes</Button></Link>
                </div>
              </div>

              {/* RESTAURANTS */}
              <div className={`p-6 h-[200px] flex flex-col ${step === 3 ? 'bg-emerald-50/50 dark:bg-emerald-900/20' : ''}`}>
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold">Restaurants</span>
                </div>
                <div className="relative h-16 rounded-md bg-gray-100 dark:bg-gray-800 overflow-hidden p-2">
                  {/* mini restaurant squares */}
                  <div className="grid grid-cols-3 gap-2">
                    <AnimatePresence>
                      {step === 3 && (
                        <>
                          <motion.div 
                            initial={{ scale: 0, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }} 
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ delay: 0.1 }}
                            className="h-8 rounded bg-white/80 dark:bg-gray-700/70 flex flex-col items-center justify-center"
                          >
                            <span className="text-[8px] text-gray-600 dark:text-gray-300 font-medium">Green</span>
                            <span className="text-[8px] text-gray-600 dark:text-gray-300">Cafe</span>
                          </motion.div>
                          <motion.div 
                            initial={{ scale: 0, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }} 
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ delay: 0.2 }}
                            className="h-8 rounded bg-white/80 dark:bg-gray-700/70 flex flex-col items-center justify-center"
                          >
                            <span className="text-[8px] text-gray-600 dark:text-gray-300 font-medium">Vegan</span>
                            <span className="text-[8px] text-gray-600 dark:text-gray-300">Bistro</span>
                          </motion.div>
                          <motion.div 
                            initial={{ scale: 0, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }} 
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ delay: 0.3 }}
                            className="h-8 rounded bg-white/80 dark:bg-gray-700/70 flex flex-col items-center justify-center"
                          >
                            <span className="text-[8px] text-gray-600 dark:text-gray-300 font-medium">Plant</span>
                            <span className="text-[8px] text-gray-600 dark:text-gray-300">Kitchen</span>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                    {step !== 3 && (
                      <>
                        <div className="h-8 rounded bg-white/50 dark:bg-gray-700/30" />
                        <div className="h-8 rounded bg-white/50 dark:bg-gray-700/30" />
                        <div className="h-8 rounded bg-white/50 dark:bg-gray-700/30" />
                      </>
                    )}
                  </div>
                </div>
                {/* pin drop - positioned below the content box */}
                <div className="h-6 flex items-center">
                  <AnimatePresence>
                    {step === 3 && (
                      <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }} className="text-emerald-600 text-xs font-semibold">
                        📍 Found nearby!
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="mt-auto">
                  <Link to="/map"><Button size="sm" variant="outline">Find Restaurants</Button></Link>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-emerald-100/60 dark:border-emerald-800/60">
              <p className="text-sm text-muted-foreground">Preview Kaizo: Scan products, discover recipes, and find vegan-friendly restaurants.</p>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setPaused((p) => !p)} aria-pressed={paused} aria-label={paused ? 'Resume preview' : 'Pause preview'}>
                  <Pause className="w-4 h-4 mr-1" /> {paused ? 'Resume' : 'Pause'}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setStep(1)} aria-label="Replay animation">
                  <RotateCw className="w-4 h-4 mr-1" /> Replay
                </Button>
              </div>
            </div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* Cursor change region */}
      <style>{`.feature-hover:hover{ cursor: zoom-in }`}</style>
    </div>
  );
};

export default FeaturePreviewHover;
