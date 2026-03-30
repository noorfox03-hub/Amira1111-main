import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const WelcomePage = () => {
    const navigate = useNavigate();
    const [displayedText, setDisplayedText] = useState('');
    const fullText = "Ms. Amira";

    useEffect(() => {
        let index = 0;
        const interval = setInterval(() => {
            if (index <= fullText.length) {
                setDisplayedText(fullText.slice(0, index));
                index++;
            } else {
                clearInterval(interval);
            }
        }, 150);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative min-h-screen w-full overflow-hidden font-sans">
            {/* Background Image with Overlay */}
            <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-[20s] hover:scale-110"
                style={{ backgroundImage: "url('/doctor-bg.png')" }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-rose-50/20 via-transparent to-rose-200/40 backdrop-blur-[2px]" />

            {/* Main Content */}
            <div className="relative z-10 flex h-screen flex-col items-center justify-center px-4 text-center" dir="ltr">
                <div className="animate-in fade-in zoom-in duration-1000">
                    <h1 className="mb-2 text-6xl font-extrabold tracking-tighter text-rose-800 drop-shadow-lg md:text-8xl lg:text-9xl" style={{ fontFamily: "'Playfair Display', serif" }}>
                        {displayedText.split('').map((char, i) => (
                            <span key={i} className="inline-block animate-in fade-in slide-in-from-left-4 duration-500 fill-mode-both" style={{ animationDelay: `${i * 100}ms` }}>
                                {char === ' ' ? '\u00A0' : char}
                            </span>
                        ))}
                    </h1>
                    <p className="mt-4 text-xl font-light tracking-widest text-rose-700/80 uppercase md:text-2xl animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
                        Premium Dental Care & Aesthetics
                    </p>
                </div>
            </div>

            {/* Chic Bottom Bar */}
            <div className="absolute bottom-0 left-0 right-0 z-20 animate-in slide-in-from-bottom-full duration-1000 delay-700">
                <div className="mx-auto mb-8 max-w-lg overflow-hidden rounded-full border border-white/30 bg-white/10 p-2 backdrop-blur-xl shadow-2xl shadow-rose-200/50">
                    <div className="flex items-center justify-between pl-6 pr-2">
                        <span className="text-sm font-medium tracking-wide text-rose-900/70 uppercase">جاهز للإدارة؟</span>
                        <Button
                            onClick={() => navigate('/login')}
                            className="group h-12 rounded-full bg-rose-500 px-8 text-lg font-semibold text-white transition-all hover:bg-rose-600 hover:shadow-lg hover:shadow-rose-400 active:scale-95"
                        >
                            الاتجاه للإدارة
                            <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Floating Elements for "Girly" feel */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                {[...Array(6)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute rounded-full bg-rose-300/20 blur-3xl animate-pulse"
                        style={{
                            width: `${Math.random() * 300 + 100}px`,
                            height: `${Math.random() * 300 + 100}px`,
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 100}%`,
                            animationDelay: `${i * 2}s`,
                            animationDuration: `${Math.random() * 5 + 5}s`
                        }}
                    />
                ))}
            </div>
        </div>
    );
};

export default WelcomePage;
