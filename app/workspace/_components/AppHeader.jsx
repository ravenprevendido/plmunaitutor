import { SidebarTrigger } from '@/components/ui/sidebar'
import { UserButton, useUser } from '@clerk/nextjs'
import React, { useEffect, useRef, useState } from 'react'
import { IoNotifications } from 'react-icons/io5'
import { BookOpen, FileText, ClipboardList, X, Mail, Sun, Moon } from 'lucide-react'
import { useTheme } from './ThemeProvider'

function AppHeader () {
    const { user } = useUser();
    const { theme, toggleTheme } = useTheme();
    const [showNotif, setShowNotif] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isToggling, setIsToggling] = useState(false);
    const [previousTheme, setPreviousTheme] = useState(theme);
    const [transitionState, setTransitionState] = useState({ isActive: false, x: 0, y: 0, isDarkening: false, circleSize: 0 });
    const notifRef = useRef(null);
    const themeButtonRef = useRef(null);
    
    useEffect(() => {
        const handleClickOutside = (event) => {
            if(notifRef.current && !notifRef.current.contains(event.target)){
                setShowNotif(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside )
        }
    }, [])

    useEffect(() => {
        if (user?.id) {
            fetchNotifications();
            // Refresh notifications every 30 seconds
            const interval = setInterval(fetchNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [user?.id])

    const fetchNotifications = async () => {
        try {
            const response = await fetch(`/api/student-notifications?student_id=${user?.id}`);
            if (response.ok) {
                const data = await response.json();
                const unread = data.filter(n => !n.is_read);
                setNotifications(data.slice(0, 10)); // Show latest 10
                setUnreadCount(unread.length);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    }

    const markAsRead = async (notificationId) => {
        try {
            const response = await fetch('/api/student-notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    notificationId: notificationId,
                    studentId: user?.id
                })
            });

            if (response.ok) {
                setNotifications(prev => 
                    prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'new_lesson':
                return <BookOpen size={16} className="text-blue-400" />;
            case 'new_quiz':
                return <FileText size={16} className="text-yellow-400" />;
            case 'new_assignment':
                return <ClipboardList size={16} className="text-purple-400" />;
            default:
                return <IoNotifications size={16} className="text-gray-400" />;
        }
    }

    const getTimeAgo = (createdAt) => {
        const now = new Date();
        const created = new Date(createdAt);
        const diffInMinutes = Math.floor((now - created) / (1000 * 60));
        
        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays}d ago`;
    }

    const createMailtoLink = (notification) => {
        const teacherEmail = notification.teacher_email || '';
        const studentEmail = user?.primaryEmailAddress?.emailAddress || '';
        const subject = encodeURIComponent(
            `Re: ${notification.message} - ${notification.course_title || 'Course'}`
        );
        const body = encodeURIComponent(
            `Hello ${notification.teacher_name || 'Teacher'},\n\n` +
            `Regarding: ${notification.message}\n` +
            `Course: ${notification.course_title || 'Course'}\n\n` +
            `[Your message here]`
        );
        
        // mailto link that opens student's email client
        return `mailto:${teacherEmail}?subject=${subject}&body=${body}`;
    }

    const handleThemeToggle = (e) => {
        setPreviousTheme(theme);
        setIsToggling(true);
        
        // Get button position for circular transition
        if (themeButtonRef.current) {
            const rect = themeButtonRef.current.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;
            
            // Determine if we're darkening (light -> dark) or brightening (dark -> light)
            const isDarkening = theme === 'light';
            
            // Calculate maximum circle size to cover entire viewport
            const maxSize = Math.sqrt(window.innerWidth ** 2 + window.innerHeight ** 2);
            
            // Start the circular transition
            setTransitionState({
                isActive: true,
                x: x,
                y: y,
                isDarkening: isDarkening,
                circleSize: 0
            });
            
            // Animate circle expansion for both directions
            const startTime = Date.now();
            const duration = 2000; // 2s - slower, more gradual transition
            
            // Apply theme change immediately
            // CSS transitions (1s duration) will handle the smooth color changes
            // No overlay needed - elements transition naturally
            toggleTheme();
            
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                // Smooth easing function (ease-out cubic) for gradual spread
                const eased = 1 - Math.pow(1 - progress, 3);
                
                const currentCircleSize = eased * maxSize;
                
                setTransitionState(prev => ({
                    ...prev,
                    circleSize: currentCircleSize
                }));
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    // Animation complete
                    setTimeout(() => {
                        setIsToggling(false);
                        setTransitionState({ isActive: false, x: 0, y: 0, isDarkening: false, circleSize: 0 });
                    }, 100);
                }
            };
            
            requestAnimationFrame(animate);
        } else {
            // Fallback if ref is not available
            toggleTheme();
            setTimeout(() => {
                setIsToggling(false);
            }, 600);
        }
    }
    
    // Determine rotation direction based on previous theme
    const getRotationClass = () => {
        if (!isToggling) return 'rotate-0 scale-100';
        // When toggling from dark to light, rotate clockwise
        // When toggling from light to dark, rotate counter-clockwise
        return previousTheme === 'dark' 
            ? 'rotate-[360deg] scale-110' 
            : 'rotate-[-360deg] scale-110';
    }

    return (
        <>
            {/* Circular Transition Effect - Shows new theme spreading in a circle
                Uses mask to reveal new theme inside circle without covering content.
                The mask approach allows content to remain visible while showing transition. */}
            {transitionState.isActive && (
                <div 
                    className={`fixed inset-0 z-[9999] pointer-events-none ${
                        transitionState.isDarkening 
                            ? 'bg-[#0D1117]' // New dark theme spreading
                            : 'bg-white' // New light theme spreading
                    }`}
                    style={{
                        // Mask: transparent inside circle (reveals new theme), opaque outside
                        // This creates circular effect without fully covering content
                        maskImage: `radial-gradient(circle ${transitionState.circleSize}px at ${transitionState.x}px ${transitionState.y}px, transparent 0%, transparent ${Math.max(0, transitionState.circleSize - 1)}px, black ${transitionState.circleSize}px)`,
                        WebkitMaskImage: `radial-gradient(circle ${transitionState.circleSize}px at ${transitionState.x}px ${transitionState.y}px, transparent 0%, transparent ${Math.max(0, transitionState.circleSize - 1)}px, black ${transitionState.circleSize}px)`,
                        mixBlendMode: transitionState.isDarkening ? 'multiply' : 'screen',
                        opacity: 0.5, // Subtle overlay to help with visual transition
                        willChange: 'mask-image',
                    }}
                />
            )}
            
            <div className='p-4 flex justify-between items-center shadow-sm bg-white dark:bg-[#0D1117] border-b border-gray-200 dark:border-gray-800'>
                <SidebarTrigger className='text-green-600 dark:text-green-400'/> 
                <span className='md:hidden visible text-gray-900 dark:text-white text-1xl'>
                    <span className='text-green-600 dark:text-green-500'>PLMun</span> 
                    <span className='text-gray-600 dark:text-gray-300'> AI - Tutor</span>
                </span>
                <div className='relative flex items-center gap-3 ml-auto' ref={notifRef}>
                    {/* Theme Toggle Button */}
                    <button
                        ref={themeButtonRef}
                        onClick={handleThemeToggle}
                    className={`relative p-2.5 rounded-xl bg-gray-100 dark:bg-[#161B22] hover:bg-gray-200 dark:hover:bg-[#1E242B] 
                        border border-gray-200 dark:border-gray-700 
                        transition-all duration-300 ease-in-out
                        ${isToggling ? 'scale-95' : 'scale-100'}
                        hover:scale-110 active:scale-95
                        shadow-md hover:shadow-lg dark:shadow-gray-900/50
                        overflow-hidden group`}
                    aria-label='Toggle theme'
                    title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                    {/* Ripple Effect */}
                    <span className={`absolute inset-0 rounded-xl ${
                        isToggling 
                            ? 'bg-gradient-to-r from-yellow-400/20 via-orange-400/20 to-yellow-400/20 dark:from-yellow-500/30 dark:via-orange-500/30 dark:to-yellow-500/30 animate-pulse' 
                            : ''
                    }`}></span>
                    
                    {/* Icon with rotation and scale animation */}
                    <span className={`relative z-10 inline-block transition-all duration-500 ease-in-out ${getRotationClass()}`}>
                        {theme === 'dark' ? (
                            <Sun className={`w-5 h-5 text-yellow-500 transition-all duration-500 ${
                                isToggling ? 'drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]' : ''
                            }`} />
                        ) : (
                            <Moon className={`w-5 h-5 text-gray-700 dark:text-blue-400 transition-all duration-500 ${
                                isToggling ? 'drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]' : ''
                            }`} />
                        )}
                    </span>
                    {/* Glow effect on hover */}
                    <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-yellow-400/10 via-orange-400/10 to-yellow-400/10 dark:from-blue-400/10 dark:via-purple-400/10 dark:to-blue-400/10"></span>
                </button>
                
                <div className='relative' onClick={() => setShowNotif(!showNotif)}>
                    <IoNotifications className='text-gray-700 dark:text-white hover:text-green-600 dark:hover:text-green-500 md:w-5 cursor-pointer transition-colors' />
                    {unreadCount > 0 && (
                        <span className='absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold'>
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </div>
                
                {/* Notification Dropdown */}
                {showNotif && (
                    <div className='absolute right-0 top-12 w-80 md:w-96 text-gray-900 dark:text-white bg-white dark:bg-[#161B22] rounded-xl shadow-lg z-50 border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto'>
                        <div className='p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center'>
                            <p className='font-semibold text-sm text-green-600 dark:text-green-400'>🔔 Notifications</p>
                            <button 
                                onClick={() => setShowNotif(false)}
                                className='text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white'
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className='p-2'>
                            {notifications.length === 0 ? (
                                <div className='text-center py-8 text-gray-500 dark:text-gray-400 text-sm'>
                                    <IoNotifications size={32} className='mx-auto mb-2 opacity-50' />
                                    <p>No notifications yet</p>
                                </div>
                            ) : (
                                <ul className='space-y-2'>
                                    {notifications.map((notification) => (
                                        <li 
                                            key={notification.id}
                                            className={`bg-gray-50 dark:bg-[#0d1117] p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1E242B] transition ${
                                                !notification.is_read ? 'border-l-2 border-green-500' : ''
                                            }`}
                                        >
                                            <div className='flex items-start gap-2'>
                                                <div className='mt-0.5'>
                                                    {getNotificationIcon(notification.type)}
                                                </div>
                                                <div className='flex-1 min-w-0' onClick={() => markAsRead(notification.id)}>
                                                    <p className='text-sm text-gray-900 dark:text-white cursor-pointer'>
                                                        <span className='font-semibold text-green-600 dark:text-green-400'>
                                                            {notification.teacher_name || 'Teacher'}
                                                        </span>{' '}
                                                        {notification.message}
                                                    </p>
                                                    <p className='text-xs text-gray-500 dark:text-gray-500 mt-1'>
                                                        {getTimeAgo(notification.created_at)}
                                                    </p>
                                                </div>
                                                <div className='flex items-center gap-2 shrink-0'>
                                                    {!notification.is_read && (
                                                        <div className='w-2 h-2 bg-green-500 rounded-full mt-2'></div>
                                                    )}
                                                    {notification.teacher_email && (
                                                        <a
                                                            href={createMailtoLink(notification)}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className='p-1.5 rounded hover:bg-gray-100 dark:hover:bg-[#1E242B] transition-colors'
                                                            title='Open email client to contact teacher'
                                                        >
                                                            <Mail size={16} className='text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300' />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                )}
                <UserButton  />
            </div>
        </div>
        </>
    )   
}

export default AppHeader