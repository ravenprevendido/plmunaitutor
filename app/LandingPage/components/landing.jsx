// components/LandingHome.jsx - ENHANCED USER-FRIENDLY VERSION
"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useState, useEffect, useCallback, useRef } from "react";
import { Menu, X, GraduationCap, UserCog, BookOpen, Sparkles, TrendingUp, Users } from "lucide-react";
import { motion, useInView } from "framer-motion";

// Swiper (Carousel)
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import { Pagination } from "swiper/modules";

const defaultStats = [
  { id: "students", value: 10000, label: "Active Students", icon: Users, isPercent: false },
  { id: "courses", value: 500, label: "Courses", icon: BookOpen, isPercent: false },
  { id: "teachers", value: 200, label: "Teachers", icon: UserCog, isPercent: false },
  { id: "success", value: 95, label: "Success Rate", icon: TrendingUp, isPercent: true },
];

const formatStatValue = (value, isPercent = false) => {
  if (isPercent) return `${Math.round(value)}%`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M+`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}K+`;
  return `${Math.round(value)}+`;
};

export default function LandingHome({ setShowSignIn }) {
  const [showMobileOpen, setShowMobileOpen] = useState(false);
  const [statsData, setStatsData] = useState(defaultStats);
  const [animatedStats, setAnimatedStats] = useState(defaultStats.map(() => 0));
  const statsRef = useRef(null);
  const statsInView = useInView(statsRef, { once: true, margin: "-100px" });

  const handleRoleSelection = (role) => {
    try {
      localStorage.setItem('pendingRole', role);
      console.log(`🎯 Role selected: ${role}`);
    } catch (e) {
      console.error("Failed to set role in localStorage:", e);
    }
  };

  const handleSignInClick = useCallback(() => {
    try {
      localStorage.removeItem('pendingRole');
    } catch (e) {
      console.error("Failed to clear pendingRole:", e);
    }
    setShowSignIn("sign-in");
  }, [setShowSignIn]);

  // Fetch live stats for students/teachers
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/stats");
        if (!response.ok) return;
        const data = await response.json();

        setStatsData((prev) =>
          prev.map((stat) => {
            if (stat.id === "students" && typeof data.students === "number") {
              return { ...stat, value: data.students };
            }
            if (stat.id === "teachers" && typeof data.teachers === "number") {
              return { ...stat, value: data.teachers };
            }
            if (stat.id === "courses" && typeof data.courses === "number") {
              return { ...stat, value: data.courses };
            }
            return stat;
          })
        );
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      }
    };

    fetchStats();
  }, []);

  // Animate stats when section is in view
  useEffect(() => {
    if (!statsInView) return;

    const duration = 1200;
    const startTimestamp = performance.now();
    const startValues = statsData.map(() => 0);
    const endValues = statsData.map((stat) => stat.value);

    const animate = (currentTime) => {
      const elapsed = currentTime - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setAnimatedStats(
        endValues.map((end, index) =>
          startValues[index] + (end - startValues[index]) * eased
        )
      );

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [statsInView, statsData]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMobileOpen && !event.target.closest('.mobile-menu-container')) {
        setShowMobileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMobileOpen]);

  return (
    <div className="w-full relative text-white min-h-screen overflow-hidden">
      {/* Animated Background with Green/Black Theme */}
      <div className="fixed inset-0 bg-gradient-to-b from-black via-[#0a0a0a] to-[#050505] z-0 overflow-hidden">
        {/* Animated Glowing Lines */}
        <svg className="absolute inset-0 w-full h-full opacity-40" preserveAspectRatio="none" style={{ minHeight: '100vh' }}>
          <defs>
            <linearGradient id="lineGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22c55e" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#16a34a" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient id="lineGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#16a34a" stopOpacity="0.6" />
              <stop offset="50%" stopColor="#10b981" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#22c55e" stopOpacity="0.3" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Curved Lines Animation */}
          <motion.path
            d="M0,800 Q200,600 400,700 T800,650 T1200,600 T1600,550 T2000,500"
            stroke="url(#lineGradient1)"
            strokeWidth="2"
            fill="none"
            filter="url(#glow)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ 
              pathLength: 1, 
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{ 
              duration: 8, 
              repeat: Infinity,
              ease: "linear"
            }}
          />
          <motion.path
            d="M0,700 Q300,500 600,600 T1200,550 T1800,500 T2400,450"
            stroke="url(#lineGradient2)"
            strokeWidth="2"
            fill="none"
            filter="url(#glow)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ 
              pathLength: 1, 
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{ 
              duration: 10, 
              repeat: Infinity,
              ease: "linear",
              delay: 1
            }}
          />
          <motion.path
            d="M0,600 Q250,400 500,500 T1000,450 T1500,400 T2000,350"
            stroke="url(#lineGradient1)"
            strokeWidth="1.5"
            fill="none"
            filter="url(#glow)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ 
              pathLength: 1, 
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{ 
              duration: 12, 
              repeat: Infinity,
              ease: "linear",
              delay: 2
            }}
          />
        </svg>
        
        {/* Additional Animated Grid Lines */}
        <div className="absolute inset-0 opacity-20">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-full h-px bg-gradient-to-r from-transparent via-green-500 to-transparent"
              style={{ top: `${20 + i * 20}%` }}
              animate={{
                opacity: [0.1, 0.3, 0.1],
                x: [0, 100, 0],
              }}
              transition={{
                duration: 4 + i,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.5,
              }}
            />
          ))}
        </div>

        {/* Floating Glowing Dots */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-green-500/40 blur-sm"
            style={{
              width: Math.random() * 8 + 4,
              height: Math.random() * 8 + 4,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, Math.random() * 20 - 10, 0],
              opacity: [0.3, 0.7, 0.3],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: Math.random() * 4 + 3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: Math.random() * 2,
            }}
          />
        ))}

        {/* Additional Glowing Orbs */}
        <div className="absolute top-20 right-20 w-96 h-96 bg-green-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-40 left-10 w-80 h-80 bg-green-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-500/10 rounded-full blur-3xl" />
      </div>

      {/* Content Container */}
      <div className="relative z-10">
      {/* NAVBAR */}
      <nav className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-green-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center gap-2 sm:gap-3"
            >
              <Image
                src="/plmunlogo (2).png"
                alt="PLMun Logo"
                width={100}
                height={100}
                className="w-10 h-10 sm:w-12 sm:h-12"
              />
              <h1 className="text-green-400 font-bold text-lg sm:text-xl md:text-2xl">
                PLMun AI Tutor
              </h1>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              <Button
                onClick={handleSignInClick}
                variant="ghost"
                className="text-gray-300 hover:text-white hover:bg-gray-800"
              >
                Sign In
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileOpen(!showMobileOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-800 transition-colors"
              aria-label="Toggle menu"
            >
              {showMobileOpen ? (
                <X size={24} className="text-green-400" />
              ) : (
                <Menu size={24} className="text-green-400" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileOpen && (
          <>
            <div 
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setShowMobileOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className="mobile-menu-container fixed right-0 top-16 h-[calc(100vh-4rem)] w-64 bg-black/95 backdrop-blur-md border-l border-green-500/20 z-50 p-6 md:hidden overflow-y-auto"
            >
              <div className="flex flex-col gap-4">
                <Button
                  onClick={() => {
                    handleSignInClick();
                    setShowMobileOpen(false);
                  }}
                  variant="outline"
                  className="w-full border-gray-700 text-black hover:bg-gray-800"
                >
                  Sign In
                </Button>
                <div className="pt-4 border-t border-gray-800">
                  <p className="text-sm text-gray-400 mb-3">Quick Access</p>
                  <Button
                    onClick={() => {
                      handleRoleSelection('student');
                      setShowSignIn("sign-up");
                      setShowMobileOpen(false);
                    }}
                    variant="ghost"
                    className="w-full justify-start text-left text-gray-300 hover:text-white hover:bg-gray-800"
                  >
                    <GraduationCap className="mr-2 w-5 h-5" />
                    Join as Student
                  </Button>
                  <Button
                    onClick={() => {
                      handleRoleSelection('teacher');
                      setShowSignIn("sign-up");
                      setShowMobileOpen(false);
                    }}
                    variant="ghost"
                    className="w-full justify-start text-left text-gray-300 hover:text-white hover:bg-gray-800"
                  >
                    <UserCog className="mr-2 w-5 h-5" />
                    Become a Teacher
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </nav>

      {/* HERO SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 relative">
        {/* Hero Background Glow */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-green-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
        </div>
        
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16 relative z-10">
          {/* LEFT CONTENT */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="flex-1 text-center lg:text-left space-y-6"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full text-green-400 text-sm font-medium mb-4 backdrop-blur-sm shadow-lg shadow-green-500/20"
            >
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-4 h-4" />
              </motion.div>
              <span>PLMun AI Tutor Learning Platform</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight"
            >
              Learn Faster with
              <span className="block mt-2 bg-gradient-to-r from-green-400 via-emerald-400 to-green-500 bg-clip-text text-transparent">
                AI-Powered Courses
              </span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed"
            >
              Join thousands of students learning with adaptive lessons, AI guidance, and expert teachers. Learn at your own pace with our AI-powered courses.
            </motion.p>
            
            {/* Role Selection Cards */}
            <div className="grid sm:grid-cols-2 gap-4 mt-8 max-w-2xl mx-auto lg:mx-0">
              {/* Student Card */}
              <motion.div
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  handleRoleSelection('student');
                  setShowSignIn("sign-up");
                }}
                className="group relative bg-gradient-to-br from-green-600/20 to-green-700/10 border-2 border-green-500/30 rounded-xl p-6 cursor-pointer hover:border-green-500 transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-green-500/20 rounded-lg group-hover:bg-green-500/30 transition-colors">
                    <GraduationCap className="w-8 h-8 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">Join as Student</h3>
                    <p className="text-sm text-gray-400 mb-4">Start learning with AI-powered courses</p>
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                      Get Started Free
                    </Button>
                  </div>
                </div>
              </motion.div>

              {/* Teacher Card */}
              <motion.div
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  handleRoleSelection('teacher');
                  setShowSignIn("sign-up");
                }}
                className="group relative bg-gradient-to-br from-green-600/20 to-green-700/10 border-2 border-green-500/30 rounded-xl p-6 cursor-pointer hover:border-green-500 transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-green-500/20 rounded-lg group-hover:bg-green-500/30 transition-colors">
                    <UserCog className="w-8 h-8 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">Apply as a Teacher</h3>
                    <p className="text-sm text-gray-400 mb-4">Create and share your courses</p>
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                      Start Teaching
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Already have account */}
            <div className="flex items-center justify-center lg:justify-start gap-2 mt-6">
              <p className="text-gray-400 text-sm">Already have an account?</p>
              <button
                onClick={handleSignInClick}
                className="text-green-400 hover:text-green-300 font-medium text-sm underline"
              >
                Sign in here
              </button>
            </div>
          </motion.div>

          {/* RIGHT IMAGE */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="flex-1 flex justify-center lg:justify-end relative"
          >
            <div className="relative">
              {/* Animated Glow Rings */}
              <motion.div 
                className="absolute inset-0 bg-green-500/30 blur-3xl rounded-full"
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3]
                }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              <motion.div 
                className="absolute inset-0 bg-green-600/20 blur-2xl rounded-full"
                animate={{ 
                  scale: [1.2, 1, 1.2],
                  opacity: [0.2, 0.4, 0.2]
                }}
                transition={{ 
                  duration: 5, 
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1
                }}
              />
              <motion.div
                animate={{ 
                  y: [0, -20, 0],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 6, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Image
                  src="/plmun.png"
                  alt="Study Illustration"
                  width={600}
                  height={600}
                  className="relative w-[280px] sm:w-[380px] md:w-[480px] lg:w-[520px] drop-shadow-2xl"
                  priority
                  draggable={false}
                />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>
      {/* STATS SECTION */}
      <section
        ref={statsRef}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 relative"
      >
        {/* Section Background Glow */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full bg-green-500/5 rounded-full blur-3xl" />
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 relative z-10">
          {statsData.map((stat, index) => {
            const StatIcon = stat.icon;
            const displayValue = formatStatValue(
              animatedStats[index] || 0,
              stat.isPercent
            );

            return (
              <motion.div
                key={stat.id}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ 
                  scale: 1.05, 
                  y: -5,
                  boxShadow: "0 20px 40px rgba(34, 197, 94, 0.2)"
                }}
                className="text-center p-6 bg-gradient-to-br from-black/40 to-[#0a0a0a]/40 backdrop-blur-sm rounded-xl border border-green-500/30 hover:border-green-500/50 transition-all duration-300 relative overflow-hidden group"
              >
                {/* Hover Glow Effect */}
                <div className="absolute inset-0 bg-green-500/0 group-hover:bg-green-500/10 transition-colors duration-300 rounded-xl" />
                
                <motion.div
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 3, 
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: index * 0.2
                  }}
                >
                  <StatIcon className="w-8 h-8 text-green-400 mx-auto mb-3 relative z-10" />
                </motion.div>
                <motion.div 
                  className="text-3xl md:text-4xl font-bold text-white mb-1 relative z-10"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 + 0.3 }}
                >
                  {displayValue}
                </motion.div>
                <div className="text-sm text-gray-300 relative z-10">{stat.label}</div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* FEATURED COURSES — CAROUSEL */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 relative">
        {/* Section Background Glow */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse" />
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 relative z-10"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-green-300 to-white bg-clip-text text-transparent">
            Featured Courses
          </h2>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Explore our most popular courses designed by expert teachers
          </p>
        </motion.div>

        <Swiper
          slidesPerView={1}
          spaceBetween={20}
          pagination={{ clickable: true }}
          modules={[Pagination]}
          breakpoints={{
            640: { slidesPerView: 2, spaceBetween: 24 },
            1024: { slidesPerView: 3, spaceBetween: 24 },
          }}
          className="w-full pb-12"
        >
          {[
            {
              title: "Introduction to Python",
              img: "/java.png",
              level: "Beginner",
            },
            {
              title: "Web Development",
              img: "/web.png",
              level: "Intermediate",
            },
            {
              title: "Java OOP",
              img: "/one.png",
              level: "Intermediate",
            },
            {
              title: "Data Structures",
              img: "/oop.png",
              level: "Advanced",
            },
          ].map((course, i) => (
            <SwiperSlide key={i}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ scale: 1.05, y: -10, rotateY: 5 }}
                className="bg-gradient-to-br from-black/40 to-[#0a0a0a]/40 backdrop-blur-sm rounded-xl overflow-hidden border border-green-500/30 shadow-xl hover:border-green-500/50 hover:shadow-green-500/20 transition-all duration-300 h-full flex flex-col relative group"
              >
                {/* Hover Glow */}
                <div className="absolute inset-0 bg-green-500/0 group-hover:bg-green-500/10 transition-colors duration-300 rounded-xl" />
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={course.img}
                    alt={course.title}
                    width={400}
                    height={200}
                    className="h-full w-full object-cover"
                    draggable={false}
                  />
                  <div className="absolute top-3 right-3">
                    <span className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                      {course.level}
                    </span>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col relative z-10">
                  <h4 className="text-xl font-semibold mb-2 text-white">{course.title}</h4>
                  <p className="text-gray-300 text-sm mb-4 flex-1">{course.level} Level Course</p>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg shadow-green-500/30"
                      onClick={() => {
                        handleRoleSelection('student');
                        setShowSignIn("sign-up");
                      }}
                    >
                      Enroll Now
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            </SwiperSlide>
          ))}
        </Swiper>
      </section>

      {/* HOW IT WORKS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 relative">
        {/* Section Background Glow */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse" />
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 relative z-10"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-green-300 to-white bg-clip-text text-transparent">
            How It Works
          </h2>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Get started in three simple steps
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {[
            {
              icon: BookOpen,
              title: "Enroll in Courses",
              text: "Browse and choose from hundreds of courses created by expert teachers.",
              color: "green",
            },
            {
              icon: Sparkles,
              title: "Learn With AI",
              text: "Get instant help and personalized study guidance from our AI tutor.",
              color: "green",
            },
            {
              icon: TrendingUp,
              title: "Track Progress",
              text: "Monitor your learning journey with detailed analytics and achievements.",
              color: "green",
            },
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30, rotateX: -15 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              whileHover={{ scale: 1.08, y: -12, rotateY: 5 }}
              className="bg-gradient-to-br from-black/40 to-[#0a0a0a]/40 backdrop-blur-sm p-8 rounded-xl border border-green-500/30 shadow-xl hover:border-green-500/50 hover:shadow-green-500/20 transition-all duration-300 text-center relative group overflow-hidden"
            >
              {/* Animated Background Gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/0 via-green-600/0 to-green-500/0 group-hover:from-green-500/10 group-hover:via-green-600/10 group-hover:to-green-500/10 transition-all duration-500" />
              
              <motion.div 
                className={`inline-flex p-4 rounded-full bg-${item.color}-500/20 mb-6 relative z-10`}
                animate={{ 
                  rotate: [0, 360],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 8, 
                  repeat: Infinity,
                  ease: "linear"
                }}
              >
                <item.icon className={`w-8 h-8 text-${item.color}-400`} />
              </motion.div>
              <h3 className="text-xl font-semibold text-white mb-3 relative z-10">{item.title}</h3>
              <p className="text-gray-300 relative z-10">{item.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 relative">
        {/* CTA Background Glow */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-r from-green-500/10 via-green-600/10 to-green-500/10 rounded-full blur-3xl" />
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="bg-gradient-to-r from-green-600/20 via-green-700/20 to-green-600/20 backdrop-blur-md border-2 border-green-500/40 rounded-2xl p-8 md:p-12 text-center relative overflow-hidden shadow-2xl"
        >
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.3),transparent_50%)]" />
            <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(22,163,74,0.3),transparent_50%)]" />
          </div>
          
          <motion.h2 
            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 relative z-10 bg-gradient-to-r from-white via-green-300 to-white bg-clip-text text-transparent"
            animate={{ 
              backgroundPosition: ['0%', '100%'],
            }}
            transition={{ 
              duration: 5, 
              repeat: Infinity, 
              repeatType: "reverse",
              ease: "linear"
            }}
          >
            Ready to Start Learning?
          </motion.h2>
          <p className="text-gray-200 text-lg mb-8 max-w-2xl mx-auto relative z-10">
            Join on our AI-powered learning platform to Personalize your learning experience.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => {
                  handleRoleSelection('student');
                  setShowSignIn("sign-up");
                }}
                size="lg"
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-6 text-lg shadow-lg shadow-green-500/40 relative overflow-hidden group"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <GraduationCap className="mr-2 w-5 h-5 relative z-10" />
                <span className="relative z-10">Join as Student</span>
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => {
                  handleRoleSelection('teacher');
                  setShowSignIn("sign-up");
                }}
                size="lg"
                variant="outline"
                className="border-2 border-green-500/50 text-green-400 hover:bg-green-500/20 hover:border-green-400 px-8 py-6 text-lg backdrop-blur-sm relative overflow-hidden group"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-green-500/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <UserCog className="mr-2 w-5 h-5 relative z-10" />
                <span className="relative z-10">Become a Teacher</span>
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </section>
      </div>
    </div>
  );
}