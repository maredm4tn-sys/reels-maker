"use client";

import { Layers } from "lucide-react";
import { AudioPanel } from "@/components/workspace/AudioPanel";
import { VisualsPanel } from "@/components/workspace/VisualsPanel";
import { TextPanel } from "@/components/workspace/TextPanel";
import { ExportPanel } from "@/components/workspace/ExportPanel";
import { PreviewCanvas } from "@/components/workspace/PreviewCanvas";


export default function Home() {
  return (
    <div className="min-h-screen flex flex-col pt-8 pb-12 px-4 md:px-8 max-w-[1600px] mx-auto">

      {/* Header */}
      <header className="flex flex-col items-center justify-center mb-10 text-center space-y-3">
        <div className="w-14 h-14 bg-surface rounded-2xl flex items-center justify-center shadow-lg border border-border/50">
          <Layers className="text-primary w-7 h-7" />
        </div>
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-yellow-600">
            صانع فيديوهات الريلز
          </h1>
          <p className="text-muted-foreground mt-2 text-sm md:text-base">
            أنشئ فيديوهات لليوتيوب والتيك توك بسهولة وبتحكم كامل
          </p>
        </div>
      </header>

      {/* Main Workspace Grid */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* Right Column: Source & Text (3 cols) */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <AudioPanel />
          <TextPanel />
        </div>

        {/* Middle Column: Visuals & Settings (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <VisualsPanel />
          <ExportPanel />
        </div>

        {/* Left Column: Video Preview Canvas (4 cols) */}
        <div className="lg:col-span-4 h-full min-h-[600px]">
          <PreviewCanvas />
        </div>



      </main>

    </div>
  );
}
