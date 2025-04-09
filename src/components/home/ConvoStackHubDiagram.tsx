import React, { useState, useEffect, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import chatgptLogo from '../../assets/platforms/chatgpt-logo-green.png';
import claudeLogo from '../../assets/platforms/claude-logo.png';
import geminiLogo from '../../assets/platforms/gemini-logo.png';
import perplexityLogo from '../../assets/platforms/perplexity-logo.png';
import deepseekLogo from '../../assets/platforms/deepseek-logo.png';
import lovableLogo from '../../assets/platforms/lovable-logo.png';
import convoStackLogo from '../../assets/platforms/convo-stack-logo-bg.png';

interface Platform {
    id: string;
    name: string;
    color: string;
    logo: string;
}

interface DataParticle {
    id: string;
    platformId: string;
    progress: number;
    color: string;
    size: number;
    pathType: 'incoming' | 'outgoing';
}

interface ParticlePosition {
    x: number;
    y: number;
}

interface ConvoStackHubDiagramProps {
    className?: string;
    compactMode?: boolean;
    showAllConnections?: boolean;
}

const ConvoStackHubDiagram: React.FC<ConvoStackHubDiagramProps> = ({ 
    className = "", 
    compactMode = false,
    showAllConnections = false
}) => {

    const platforms: Platform[] = [
        { id: 'chatgpt', name: "ChatGPT", color: "#10a37f", logo: chatgptLogo },
        { id: 'claude', name: "Claude", color: "#ff987b ", logo: claudeLogo },
        { id: 'gemini', name: "Gemini", color: "#709ade", logo: geminiLogo },
        { id: 'perplexity', name: "Perplexity", color: "#2fc9dd", logo: perplexityLogo },
        { id: 'deepseek', name: "Deepseek", color: "#0066FF", logo: deepseekLogo },
        { id: 'lovable', name: "Lovable", color: "#F6B93B", logo: lovableLogo }
    ];

    const brandColor = "#8C5AF2";
    const [activePlatform, setActivePlatform] = useState<string | null>(null);
    const [dataParticles, setDataParticles] = useState<DataParticle[]>([]);
    const [showDemo, setShowDemo] = useState<boolean>(false);
    const [isDarkMode, setIsDarkMode] = useState(true);
    const hubControls = useAnimation();
    const demoMessageControls = useAnimation();
    const hubRef = useRef<HTMLDivElement>(null);
    const platformRefs = useRef<{[key: string]: HTMLDivElement | null}>({});

    useEffect(() => {
        const checkDarkMode = () => {
            const isDark = document.documentElement.classList.contains('dark');
            setIsDarkMode(isDark);
        };
        
        checkDarkMode();
        
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    checkDarkMode();
                }
            });
        });
        
        observer.observe(document.documentElement, { attributes: true });
        
        return () => observer.disconnect();
    }, []);
    
    const useRandomInterval = (callback: () => void, minDelay: number, maxDelay: number) => {
        const timeoutId = useRef<number | null>(null);
        const savedCallback = useRef(callback);
        
        useEffect(() => {
            savedCallback.current = callback;
        }, [callback]);
        
        useEffect(() => {
            let isEnabled = true;
            
            const handleTick = () => {
                const nextTickAt = minDelay + Math.random() * (maxDelay - minDelay);
                
                timeoutId.current = window.setTimeout(() => {
                    if (isEnabled) {
                        savedCallback.current();
                        handleTick();
                    }
                }, nextTickAt);
            };
            
            handleTick();
            
            return () => {
                isEnabled = false;
                if (timeoutId.current) {
                    window.clearTimeout(timeoutId.current);
                }
            };
        }, [minDelay, maxDelay]);
        
        return timeoutId;
    };
    
    useEffect(() => {
        hubControls.start({
            scale: [1, 1.05, 1],
            transition: { duration: 3, ease: "easeInOut", repeat: Infinity, repeatDelay: 1 }
        });
    }, []);
    
    useRandomInterval(() => {
        if (dataParticles.length > (compactMode ? 15 : 25)) return;
        
        const platform = platforms[Math.floor(Math.random() * platforms.length)];
        const isIncoming = Math.random() > 0.3;
        
        setDataParticles(particles => [
            ...particles,
            {
                id: `particle-${Date.now()}-${Math.random()}`,
                platformId: platform.id,
                progress: 0,
                color: platform.color,
                size: compactMode ? Math.random() * 4 + 2 : Math.random() * 5 + 3,
                pathType: isIncoming ? 'incoming' : 'outgoing'
            }
        ]);
    }, compactMode ? 300 : 150, compactMode ? 800 : 500);
    
    useEffect(() => {
        const interval = setInterval(() => {
            setDataParticles(particles => 
                particles
                    .map(p => ({ ...p, progress: p.progress + (compactMode ? 0.015 : 0.01) }))
                    .filter(p => p.progress < 1)
            );
        }, 20);
        
        return () => clearInterval(interval);
    }, [compactMode]);
    
    useEffect(() => {
        if (compactMode) return;
        
        const demoTimeout = setTimeout(() => {
            setShowDemo(true);
            demoMessageControls.start({ opacity: 1, y: 0, transition: { duration: 0.5 } });
            
            const demoSequence = async () => {
                await new Promise(r => setTimeout(r, 3000));
                
                for (const platform of platforms) {
                    setActivePlatform(platform.id);
                    await new Promise(r => setTimeout(r, 2500));
                    setActivePlatform(null);
                    await new Promise(r => setTimeout(r, 500));
                }
                
                demoMessageControls.start({ opacity: 0, y: 10, transition: { duration: 0.5 } });
                await new Promise(r => setTimeout(r, 500));
                setShowDemo(false);
            };
            
            demoSequence();
        }, 2000);
        
        return () => clearTimeout(demoTimeout);
    }, [compactMode]);
    
    const getParticlePosition = (progress: number, platformId: string, pathType: string): ParticlePosition => {
        if (!hubRef.current || !platformRefs.current[platformId]) return { x: 0, y: 0 };
        
        const hubRect = hubRef.current.getBoundingClientRect();
        const platformRect = platformRefs.current[platformId].getBoundingClientRect();
        
        const hubCenterX = hubRect.left + hubRect.width / 2;
        const hubCenterY = hubRect.top + hubRect.height / 2;
        const platformCenterX = platformRect.left + platformRect.width / 2;
        const platformCenterY = platformRect.top + platformRect.height / 2;
        
        const parentRect = hubRef.current.parentElement?.getBoundingClientRect() || hubRect;
        
        const relativeHubX = hubCenterX - parentRect.left;
        const relativeHubY = hubCenterY - parentRect.top;
        const relativePlatformX = platformCenterX - parentRect.left;
        const relativePlatformY = platformCenterY - parentRect.top;
        
        if (pathType === 'incoming') {
            return {
                x: relativePlatformX + (relativeHubX - relativePlatformX) * progress,
                y: relativePlatformY + (relativeHubY - relativePlatformY) * progress
            };
        } else {
            return {
                x: relativeHubX + (relativePlatformX - relativeHubX) * progress,
                y: relativeHubY + (relativePlatformY - relativeHubY) * progress
            };
        }
    };
    
    const renderDemoMessage = () => {
        if (!showDemo || compactMode) return null;
        
        return (
            <motion.div
                className="absolute bottom-6 left-0 right-0 mx-auto w-10/12 max-w-lg bg-black/80 backdrop-blur-lg rounded-xl p-4 text-center z-20 border border-white/20"
                initial={{ opacity: 0, y: 20 }}
                animate={demoMessageControls}
            >
                <h3 className="text-lg font-semibold text-white mb-2">
                    ConvoStack Organizes All Your AI Conversations
                </h3>
                <p className="text-sm text-gray-300">
                    Save and organize valuable insights from multiple AI platforms in one central location.
                </p>
            </motion.div>
        );
    };

    const getPositionStyles = (index: number, total: number): React.CSSProperties => {
        const angle = (index * (2 * Math.PI / total)) - Math.PI / 2;
        const radius = compactMode ? 38 : 42;
        const x = 50 + radius * Math.cos(angle);
        const y = 50 + radius * Math.sin(angle);
        
        return { left: `${x}%`, top: `${y}%` };
    };

    const setNodeRef = (id: string, element: HTMLDivElement | null) => {
        platformRefs.current[id] = element;
    };

    const handleImageError = (event: React.SyntheticEvent<HTMLImageElement, Event>, platformId: string) => {
        const emojis: {[key: string]: string} = {
            'chatgpt': '🤖',
            'claude': '🧠',
            'gemini': '👁️',
            'perplexity': '🔍',
            'deepseek': '🔮',
            'lovable': '❤️',
            'convostack': '📑'
        };
        
        const target = event.target as HTMLImageElement;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 48;
        canvas.height = 48;
        if (ctx) {
            ctx.font = '32px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(emojis[platformId] || '📄', 24, 24);
            target.src = canvas.toDataURL();
        }
    };

    // Calculate connection line path
    const getConnectionPath = (platformId: string) => {
        if (!hubRef.current || !platformRefs.current[platformId]) return '';
        
        const hubRect = hubRef.current.getBoundingClientRect();
        const platformRect = platformRefs.current[platformId].getBoundingClientRect();
        
        const hubCenterX = hubRect.left + hubRect.width / 2;
        const hubCenterY = hubRect.top + hubRect.height / 2;
        const platformCenterX = platformRect.left + platformRect.width / 2;
        const platformCenterY = platformRect.top + platformRect.height / 2;
        
        const parentRect = hubRef.current.parentElement?.getBoundingClientRect() || hubRect;
        
        const relativeHubX = hubCenterX - parentRect.left;
        const relativeHubY = hubCenterY - parentRect.top;
        const relativePlatformX = platformCenterX - parentRect.left;
        const relativePlatformY = platformCenterY - parentRect.top;
        
        // Calculate direction vector
        const dx = relativePlatformX - relativeHubX;
        const dy = relativePlatformY - relativeHubY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Normalize direction vector
        const nx = dx / distance;
        const ny = dy / distance;
        
        // Calculate start and end points that don't overlap with the logos
        const hubRadius = hubRect.width / 2;
        const platformRadius = platformRect.width / 2;
        
        const startX = relativeHubX + nx * hubRadius;
        const startY = relativeHubY + ny * hubRadius;
        const endX = relativePlatformX - nx * platformRadius;
        const endY = relativePlatformY - ny * platformRadius;
        
        return `M${startX},${startY} L${endX},${endY}`;
    };

    const hubSize = compactMode ? "w-16 h-16 md:w-20 md:h-20" : "w-32 h-32 md:w-40 md:h-40";
    const platformSize = compactMode ? "w-12 h-12 md:w-14 md:h-14" : "w-20 h-20 md:w-24 md:h-24";
    const logoSize = compactMode ? "w-5 h-5 md:w-6 md:h-6" : "w-10 h-10 md:w-12 md:h-12";
    const centerLogoSize = compactMode ? "w-12 h-12 md:w-12 md:h-12" : "w-16 h-16 md:w-16 md:h-16";
    const centerTextSize = compactMode ? "text-xs md:text-sm" : "text-lg md:text-xl";
    const platformTextSize = compactMode ? "text-[10px]" : "text-xs";

    return (
        <div className={`w-full h-full relative flex justify-center items-center ${className}`}>
            <div className="relative w-full max-w-4xl h-full px-4">
                <div className="absolute inset-0 bg-gradient-radial from-primary/5 to-transparent rounded-3xl"></div>
                
                {dataParticles.map(particle => {
                    const position = getParticlePosition(
                        particle.progress, 
                        particle.platformId, 
                        particle.pathType
                    );
                    
                    return (
                        <motion.div
                            key={particle.id}
                            className="absolute rounded-full z-10"
                            style={{
                                backgroundColor: particle.color,
                                width: `${particle.size}px`,
                                height: `${particle.size}px`,
                                left: position.x,
                                top: position.y,
                                boxShadow: `0 0 ${particle.size * 4}px ${particle.color}, 0 0 ${particle.size * 2}px ${particle.color}, 0 0 ${particle.size}px white`,
                                filter: 'blur(0px)',
                                border: '1px solid rgba(255,255,255,0.8)',
                            }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{ duration: 1, times: [0, 0.2, 1] }}
                        />
                    );
                })}
                
                <motion.div 
                    ref={hubRef}
                    className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${hubSize} rounded-full border-4 flex items-center justify-center z-10 backdrop-blur-xl`}
                    style={{ 
                        backgroundColor: isDarkMode ? `${brandColor}40` : `${brandColor}30`,
                        borderColor: brandColor,
                        boxShadow: `0 0 30px ${brandColor}40, 0 0 15px ${brandColor}30`
                    }}
                    animate={hubControls}
                >
                    <div className="flex flex-col items-center justify-center">
                        <motion.div
                            initial={{ rotateY: 0 }}
                            animate={{ rotateY: 360 }}
                            transition={{ duration: 15, ease: "linear", repeat: Infinity }}
                            className={`${centerLogoSize} flex items-center justify-center`}
                        >
                            {convoStackLogo ? (
                                <div className="relative">
                                    <img 
                                        src={convoStackLogo} 
                                        alt="ConvoStack" 
                                        className="w-full h-full object-contain" 
                                        onError={(e) => handleImageError(e, 'convostack')}
                                    />
                                </div>
                            ) : (
                                <svg className="w-full h-full text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path>
                                </svg>
                            )}
                        </motion.div>
                        {!compactMode && (
                            <span className={`${centerTextSize} font-bold text-center mt-2 text-white`}>ConvoStack</span>
                        )}
                    </div>
                </motion.div>

                {/* Connection lines */}
                {platforms.map((platform, index) => {
                    const isActive = activePlatform === platform.id || showAllConnections;
                    
                    return (
                        <React.Fragment key={platform.id}>
                            {/* SVG path connection */}
                            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
                                <path
                                    d={getConnectionPath(platform.id)}
                                    stroke={platform.color}
                                    strokeWidth={isActive ? 3 : 2}
                                    strokeLinecap="round"
                                    fill="none"
                                    opacity={isActive ? 1 : 0.6}
                                    className="transition-all duration-300"
                                />
                            </svg>

                            {/* Platform node */}
                            <motion.div 
                                ref={(el) => setNodeRef(platform.id, el)}
                                className={`absolute flex flex-col items-center justify-center rounded-full shadow-lg border-2 ${platformSize} transform -translate-x-1/2 -translate-y-1/2 z-5 cursor-pointer backdrop-blur-md`}
                                style={{ 
                                    ...getPositionStyles(index, platforms.length),
                                    backgroundColor: `${platform.color}20`,
                                    borderColor: platform.color,
                                    padding: compactMode ? '4px' : '8px',
                                }}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ 
                                    delay: index * 0.15,
                                    duration: 0.5, 
                                    type: "spring"
                                }}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onHoverStart={() => setActivePlatform(platform.id)}
                                onHoverEnd={() => setActivePlatform(null)}
                            >
                                <motion.div 
                                    className={`${logoSize} flex items-center justify-center ${compactMode ? 'mb-0' : 'mb-1'}`}
                                    animate={{ scale: isActive ? 1.2 : 1 }}
                                    transition={{ duration: 0.3 }}
                                    style={{ maxWidth: '70%', maxHeight: '70%' }}
                                >
                                    <img 
                                        src={platform.logo} 
                                        alt={platform.name} 
                                        className="w-full h-full object-contain" 
                                        onError={(e) => handleImageError(e, platform.id)}
                                    />
                                </motion.div>
                                {!compactMode && (
                                    <motion.div 
                                        className={`${platformTextSize} font-medium whitespace-nowrap`}
                                        initial={{ opacity: 0.7 }}
                                        animate={{ opacity: isActive ? 1 : 0.7 }}
                                    >
                                        {platform.name}
                                    </motion.div>
                                )}
                                
                                {isActive && (
                                    <motion.div
                                        className="absolute inset-0 rounded-full z-0"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        style={{ 
                                            boxShadow: `0 0 15px ${platform.color}80`,
                                            background: `radial-gradient(circle, ${platform.color}30 0%, transparent 70%)`
                                        }}
                                    />
                                )}
                            </motion.div>
                        </React.Fragment>
                    );
                })}
                
                {renderDemoMessage()}
            </div>
        </div>
    );
};

export default ConvoStackHubDiagram;