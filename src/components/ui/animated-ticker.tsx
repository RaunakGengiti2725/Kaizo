import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Leaf, Heart, Zap, Shield, Users, Globe, Star, Sparkles } from 'lucide-react';

interface TickerItem {
  icon: any;
  text: string;
  color: string;
}

const tickerItems: TickerItem[] = [
  { icon: Leaf, text: "100% Plant-Based", color: "text-green-600" },
  { icon: Heart, text: "Heart-Healthy", color: "text-red-500" },
  { icon: Zap, text: "Energy Boost", color: "text-yellow-500" },
  { icon: Shield, text: "Allergy Safe", color: "text-blue-600" },
  { icon: Users, text: "Community Driven", color: "text-purple-600" },
  { icon: Globe, text: "Planet Friendly", color: "text-emerald-600" },
  { icon: Star, text: "Premium Quality", color: "text-amber-500" },
  { icon: Sparkles, text: "AI Powered", color: "text-indigo-600" },
  { icon: Leaf, text: "Cruelty Free", color: "text-green-600" },
  { icon: Heart, text: "Better Health", color: "text-red-500" },
  { icon: Zap, text: "Quick & Easy", color: "text-yellow-500" },
  { icon: Shield, text: "Transparent", color: "text-blue-600" },
  { icon: Users, text: "Expert Verified", color: "text-purple-600" },
  { icon: Globe, text: "Sustainable", color: "text-emerald-600" },
  { icon: Star, text: "Top Rated", color: "text-amber-500" },
  { icon: Sparkles, text: "Smart Choices", color: "text-indigo-600" },
];

const AnimatedTicker = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 py-4 border-y border-green-200/50 dark:border-green-800/50">
      <motion.div
        className="flex items-center space-x-8 whitespace-nowrap"
        animate={{
          x: [0, -50 * tickerItems.length],
        }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: "loop",
            duration: 30,
            ease: "linear",
          },
        }}
        initial={{ x: 0 }}
      >
        {/* Duplicate items for seamless loop */}
        {[...tickerItems, ...tickerItems].map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={index}
              className="flex items-center space-x-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 rounded-full shadow-sm border border-green-200/50 dark:border-green-800/50 backdrop-blur-sm"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Icon className={`w-4 h-4 ${item.color}`} />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {item.text}
              </span>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};

export default AnimatedTicker;
