'use client';

import {
    AppWindow,
    Smartphone,
    Monitor,
    Share,
    PlusSquare,
    MoreVertical,
    Download,
    CheckCircle2,
    ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function InstallGuidePage() {
    const steps = {
        ios: [
            { icon: Share, text: "Safari 브라우저 하단의 '공유' 아이콘을 누르세요." },
            { icon: PlusSquare, text: "'홈 화면에 추가'를 선택하세요." },
            { icon: CheckCircle2, text: "우측 상단 '추가'를 누르면 바탕화면에 앱이 생성됩니다." }
        ],
        android: [
            { icon: MoreVertical, text: "Chrome 브라우저 우측 상단 '메뉴(점 3개)'를 누르세요." },
            { icon: Download, text: "'앱 설치' 또는 '홈 화면에 추가'를 선택하세요." },
            { icon: CheckCircle2, text: "확인 버튼을 누르면 설치가 완료됩니다." }
        ],
        desktop: [
            { icon: AppWindow, text: "주소창 우측의 '앱 설치' 버튼(모니터 모양)을 누르세요." },
            { icon: Download, text: "팝업창에서 '설치'를 클릭하세요." },
            { icon: CheckCircle2, text: "바탕화면과 작업표시줄에 앱 아이콘이 생성됩니다." }
        ]
    };

    return (
        <div className="min-h-screen bg-mesh p-8">
            <div className="max-w-4xl mx-auto space-y-12 pb-20">
                <div className="flex justify-start">
                    <Link href="/login">
                        <Button variant="ghost" className="text-muted-foreground hover:text-white gap-2 -ml-4">
                            <ArrowLeft className="w-4 h-4" />
                            로그인 화면으로 돌아가기
                        </Button>
                    </Link>
                </div>

                <div className="space-y-4">
                    <h1 className="text-4xl font-brand tracking-tighter text-white">앱 설치 가이드</h1>
                    <p className="text-muted-foreground text-lg">
                        EBRC를 휴대폰이나 PC에 설치하여 더 편하게 이용해 보세요.
                        별도의 다운로드 없이 바로 앱처럼 사용할 수 있습니다.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* iOS */}
                    <div className="glass-dark rounded-3xl p-6 border-white/5 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                                <Smartphone className="w-6 h-6" />
                            </div>
                            <h2 className="text-xl font-bold text-white">iPhone / iPad</h2>
                        </div>
                        <div className="space-y-4">
                            {steps.ios.map((step, i) => (
                                <div key={i} className="flex gap-4 items-start">
                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                                        <step.icon className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                    <p className="text-sm text-white/80 leading-relaxed font-light">{step.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Android */}
                    <div className="glass-dark rounded-3xl p-6 border-white/5 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                                <Smartphone className="w-6 h-6" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Android</h2>
                        </div>
                        <div className="space-y-4">
                            {steps.android.map((step, i) => (
                                <div key={i} className="flex gap-4 items-start">
                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                                        <step.icon className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                    <p className="text-sm text-white/80 leading-relaxed font-light">{step.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Desktop */}
                    <div className="glass-dark rounded-3xl p-6 border-white/5 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                                <Monitor className="w-6 h-6" />
                            </div>
                            <h2 className="text-xl font-bold text-white">PC / Laptop</h2>
                        </div>
                        <div className="space-y-4">
                            {steps.desktop.map((step, i) => (
                                <div key={i} className="flex gap-4 items-start">
                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                                        <step.icon className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                    <p className="text-sm text-white/80 leading-relaxed font-light">{step.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
