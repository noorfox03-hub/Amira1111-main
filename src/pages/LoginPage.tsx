import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInventoryStore } from '@/store/inventoryStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { User, Lock, ArrowRight } from 'lucide-react';

const LoginPage = () => {
    const { setLoggedIn } = useInventoryStore();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (username === 'amira' && password === 'admin') {
            setLoggedIn(true);
            toast.success('مرحباً أستاذة أميرة، تم تسجيل الدخول بنجاح');
            navigate('/dashboard');
        } else {
            toast.error('خطأ في اسم المستخدم أو كلمة المرور');
        }
    };

    return (
        <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center p-4">
            {/* Premium Background */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-[url('/doctor-bg.png')]"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-rose-50/80 via-white/40 to-rose-200/60 backdrop-blur-md" />

            {/* Decorative Elements */}
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-rose-300/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-rose-400/10 rounded-full blur-3xl animate-pulse delay-700" />

            <Card className="relative z-10 w-full max-w-md bg-white/70 backdrop-blur-xl border-rose-100 shadow-2xl animate-in fade-in zoom-in duration-700">
                <CardHeader className="space-y-1 text-center">
                    <div className="mx-auto bg-rose-500/10 p-3 rounded-full w-fit mb-4">
                        <span className="text-3xl font-bold text-rose-600 tracking-tighter font-serif">
                            Welcome Ms. Amira
                        </span>
                    </div>
                    <CardTitle className="text-3xl font-bold tracking-tight text-rose-900">تسجيل الدخول</CardTitle>
                    <CardDescription className="text-rose-700/60">
                        أهلاً بكِ في نظام الإدارة الخاص بكِ
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleLogin} autoComplete="off">
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="username" className="text-rose-900 font-medium">اسم المستخدم</Label>
                            <div className="relative">
                                <User className="absolute right-3 top-3 h-4 w-4 text-rose-400" />
                                <Input
                                    id="username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="bg-white/50 border-rose-100 pr-10 focus:ring-rose-500 focus:border-rose-500"
                                    required
                                    autoComplete="off"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" title="password" className="text-rose-900 font-medium">كلمة المرور</Label>
                            <div className="relative">
                                <Lock className="absolute right-3 top-3 h-4 w-4 text-rose-400" />
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="bg-white/50 border-rose-100 pr-10 focus:ring-rose-500 focus:border-rose-500"
                                    required
                                    autoComplete="new-password"
                                />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button
                            type="submit"
                            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold h-12 rounded-xl transition-all active:scale-95 shadow-lg shadow-rose-200"
                        >
                            دخول
                            <ArrowRight className="mr-2 h-5 w-5" />
                        </Button>
                    </CardFooter>
                </form>
            </Card>

            {/* Dr. Amira Signature Style Label */}
            <div className="absolute bottom-8 text-center w-full z-10 pointer-events-none">
                <p className="text-rose-700/40 text-sm font-medium tracking-[0.2em] uppercase">
                    Powered by Premium Dental Care
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
