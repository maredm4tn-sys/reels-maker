import { bundle } from "@remotion/bundler";
import { renderMedia, getCompositions, renderStill } from "@remotion/renderer";
import path from "path";
import fs from "fs";

let cachedBundleLocation: string | null = null;

// Check for a custom FFmpeg executable
let ffmpegExecutable: string | undefined = undefined;
const potentialFfmpegPath = path.join(process.cwd(), "bin", "ffmpeg.exe");
if (fs.existsSync(potentialFfmpegPath)) {
    ffmpegExecutable = potentialFfmpegPath;
    console.log(`Using custom FFmpeg executable: ${ffmpegExecutable}`);
} else {
    console.log("Custom FFmpeg executable not found at 'bin/ffmpeg.exe'. Falling back to system PATH.");
}

async function getBundle() {
    const entryPoint = path.join(process.cwd(), "src/remotion/render-entry.tsx");
    console.log("Bundling Remotion project (this may take a few seconds)...");

    const bundleLocation = await bundle({
        entryPoint,
        // Caching is enabled by default in @remotion/bundler's internal logic, 
        // but calling bundle() again ensures it picks up project file changes.
    });

    return bundleLocation;
}

export async function renderVideo(id: string, props: any) {
    const bundleLocation = await getBundle();
    const outputLocation = path.join(process.cwd(), "public", "renders", `${id}.mp4`);

    // Ensure directory exists
    const dir = path.dirname(outputLocation);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    const compositionId = "ReelsComposition";
    const compositions = await getCompositions(bundleLocation, {
        inputProps: props
    });

    const composition = compositions.find((c) => c.id === compositionId);
    if (!composition) {
        throw new Error(`Composition ${compositionId} not found`);
    }

    console.log(`Rendering Video ${id} | Quality: ${composition.width}x${composition.height} | Frames: ${composition.durationInFrames}`);

    await renderMedia({
        composition,
        serveUrl: bundleLocation,
        codec: "h264",
        outputLocation,
        inputProps: props,
        // We can add more options like custom chromium flags if needed for low-end systems
    });

    return `/renders/${id}.mp4`;
}

/**
 * Generates a high-quality JPG thumbnail for the video at a specific frame.
 */
export async function renderThumbnail(id: string, props: any, frame: number = 10) {
    const bundleLocation = await getBundle();
    const outputLocation = path.join(process.cwd(), "public", "renders", `${id}.jpg`);

    const dir = path.dirname(outputLocation);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    const compositionId = "ReelsComposition";
    const compositions = await getCompositions(bundleLocation, {
        inputProps: props
    });

    const composition = compositions.find((c) => c.id === compositionId);
    if (!composition) {
        throw new Error(`Composition ${compositionId} not found`);
    }

    console.log(`Generating Thumbnail for ${id} at frame ${frame}`);

    await renderStill({
        composition,
        serveUrl: bundleLocation,
        output: outputLocation,
        inputProps: props,
        frame,
        imageFormat: "jpeg",
    });

    return `/renders/${id}.jpg`;
}
