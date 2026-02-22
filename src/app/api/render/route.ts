import { NextResponse } from 'next/server';
import { renderVideo } from '@/lib/render-server';
import path from 'path';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { visuals, audio, text, exportOptions } = body;

        // Generate a unique ID for this render job
        const jobId = `job_${Math.random().toString(36).substring(7)}`;

        // Detect origin to make relative URLs absolute for the Remotion renderer
        const protocol = req.headers.get('x-forwarded-proto') || 'http';
        const host = req.headers.get('host');
        const origin = `${protocol}://${host}`;

        const fixUrl = (url: string | null) => {
            if (!url) return null;
            if (url.startsWith('/')) return `${origin}${url}`;
            return url;
        };

        // props for ReelsComposition with fixed absolute URLs
        const inputProps = {
            visuals: {
                ...visuals,
                backgroundMediaUrl: fixUrl(visuals.backgroundMediaUrl)
            },
            audio: {
                ...audio,
                sourceUrl: fixUrl(audio.sourceUrl)
            },
            text,
            words: text.words,
            transcriptVersion: text.transcriptVersion || 0
        };

        console.log(`Starting real render for job: ${jobId} with origin: ${origin}`);

        try {
            const downloadUrl = await renderVideo(jobId, inputProps);

            return NextResponse.json({
                success: true,
                message: 'Video rendered successfully',
                downloadUrl,
                jobId,
                renderSettings: {
                    quality: exportOptions.quality,
                    fps: 30
                }
            });
        } catch (renderError: any) {
            console.error("Render Step Error:", renderError);

            // Helpful message for missing FFmpeg
            if (renderError.message.includes("ffmpeg") || renderError.message.includes("ENOENT")) {
                return NextResponse.json({
                    success: false,
                    error: "خطأ: ffmpeg غير مثبت على هذا الجهاز. التصدير الحقيقي يتطلب تثبيت ffmpeg.",
                    technicalError: renderError.message
                }, { status: 500 });
            }

            throw renderError;
        }

    } catch (error: any) {
        console.error("Render API Error:", error);
        return NextResponse.json({
            success: false,
            error: "فشل تصدير الفيديو: خطأ داخلي في الخادم.",
            technicalError: error.message
        }, { status: 500 });
    }
}
