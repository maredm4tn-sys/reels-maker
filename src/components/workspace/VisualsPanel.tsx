"use client";

import { useVideoStore, BackgroundType } from "@/store/useVideoStore";
import { Settings, FileVideo, Image as ImageIcon, PaintBucket, Palette } from "lucide-react";
import { Panel } from "./AudioPanel"; // Reuse wrapper

export function VisualsPanel() {
    const visuals = useVideoStore((state) => state.visuals);
    const setVisuals = useVideoStore((state) => state.setVisuals);

    const backgroundTypes: { id: BackgroundType; label: string; icon: React.ReactNode }[] = [
        { id: 'image', label: 'صور/فيديو', icon: <ImageIcon className="w-4 h-4 mb-1" /> },
        { id: 'solid', label: 'لون ثابت', icon: <PaintBucket className="w-4 h-4 mb-1" /> },
        { id: 'gradient', label: 'تدرج لوني', icon: <Palette className="w-4 h-4 mb-1" /> },
    ];

    return (
        <Panel title="إعدادات الخلفية" icon={<Settings className="w-4 h-4 text-primary" />}>
            <div className="space-y-6">

                {/* Background Type Selector */}
                <div>
                    <label className="text-sm text-gray-300 mb-3 block">نوع الخلفية</label>
                    <div className="grid grid-cols-3 gap-2">
                        {backgroundTypes.map((type) => (
                            <button
                                key={type.id}
                                onClick={() => setVisuals({ backgroundType: type.id })}
                                className={`flex flex-col items-center justify-center text-xs py-2 rounded-md transition-all border ${visuals.backgroundType === type.id
                                        ? "bg-primary/20 border-primary text-primary font-medium shadow-[0_0_10px_rgba(234,179,8,0.2)]"
                                        : "bg-surface border-border text-gray-400 hover:bg-surface-hover/10"
                                    }`}
                            >
                                {type.icon}
                                {type.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Dynamic Controls based on selected type */}
                <div className="min-h-[140px] flex flex-col justify-center border-t border-border/30 pt-4">

                    {visuals.backgroundType === 'image' && (
                        <div className="space-y-3">
                            <button
                                onClick={() => {
                                    // Dummy action to simulate upload
                                    const dummyUrl = "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=400&q=80";
                                    setVisuals({ backgroundMediaUrl: dummyUrl });
                                }}
                                className="w-full h-32 rounded-lg border border-dashed border-border/60 flex flex-col items-center justify-center bg-background/50 hover:bg-background/80 transition-colors cursor-pointer group"
                            >
                                <div className="bg-surface p-2 rounded-full mb-2 group-hover:scale-110 transition-transform">
                                    <FileVideo className="w-5 h-5 text-gray-400 group-hover:text-primary" />
                                </div>
                                <p className="text-sm text-muted-foreground group-hover:text-gray-300">انقر لرفع صورة للتجربة</p>
                            </button>

                            {visuals.backgroundMediaUrl && (
                                <button
                                    onClick={() => setVisuals({ backgroundMediaUrl: null })}
                                    className="text-xs text-red-400 hover:text-red-300 w-full text-center"
                                >
                                    إزالة الوسائط
                                </button>
                            )}
                        </div>
                    )}

                    {visuals.backgroundType === 'solid' && (
                        <div className="space-y-3">
                            <label className="text-sm text-gray-300">اختر اللون</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    value={visuals.backgroundColor}
                                    onChange={(e) => setVisuals({ backgroundColor: e.target.value })}
                                    className="w-12 h-12 rounded cursor-pointer border-0 bg-transparent p-0"
                                />
                                <span className="text-sm text-muted-foreground uppercase font-mono bg-background px-3 py-1 rounded border border-border">
                                    {visuals.backgroundColor}
                                </span>
                            </div>
                        </div>
                    )}

                    {visuals.backgroundType === 'gradient' && (
                        <div className="space-y-4">
                            <p className="text-sm text-gray-300">سيتم إضافة محرر تدرج لوني هنا لاحقاً</p>
                            {/* Fallback to simple selection for now */}
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    'linear-gradient(to right, #000000, #434343)',
                                    'linear-gradient(to top, #09203f 0%, #537895 100%)',
                                    'linear-gradient(to top, #1e3c72 0%, #1e3c72 1%, #2a5298 100%)',
                                    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                ].map((grad, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setVisuals({ backgroundGradient: grad })}
                                        className={`h-12 rounded-md border ${visuals.backgroundGradient === grad ? 'border-primary shadow-[0_0_8px_rgba(234,179,8,0.5)]' : 'border-border'}`}
                                        style={{ background: grad }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Blur Control */}
                <div className="space-y-3 pt-6 border-t border-border/30">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-300">تأثير التعتيم (Blur) الزجاجي</span>
                        <span className="text-primary font-mono bg-primary/10 px-2 py-0.5 rounded text-xs">
                            {visuals.blurAmount}px
                        </span>
                    </div>
                    <input
                        type="range"
                        min="0" max="20"
                        value={visuals.blurAmount}
                        onChange={(e) => setVisuals({ blurAmount: parseInt(e.target.value) })}
                        className="w-full h-1 bg-surface accent-primary rounded-lg appearance-none cursor-pointer border border-border/30"
                    />
                </div>

            </div>
        </Panel>
    );
}
