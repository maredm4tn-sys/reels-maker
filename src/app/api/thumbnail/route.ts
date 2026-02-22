import { NextResponse } from 'next/server';
import { renderThumbnail } from '@/lib/render-server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { visuals, audio, text, frame = 10 } = body;

        const jobId = `thumb_${Math.random().toString(36).substring(7)}`;

        // Detect origin to make relative URLs absolute for the Remotion renderer
        const protocol = req.headers.get('x-forwarded-proto') || 'http';
        const host = req.headers.get('host');
        const origin = `${protocol}://${host}`;

        const fixUrl = (url: string | null) => {
            if (!url) return null;
            if (url.startsWith('/')) return `${origin}${url}`;
            return url;
        };

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

        console.log(`Starting thumbnail render for job: ${jobId} with origin: ${origin}`);

        try {
            const downloadUrl = await renderThumbnail(jobId, inputProps, frame);

            return NextResponse.json({
                success: true,
                message: 'Thumbnail generated successfully',
                imageUrl: downloadUrl,
                jobId
            });
        } catch (renderError: any) {
            console.error("Thumbnail Step Error:", renderError);

            // Helpful message for missing FFmpeg (renderStill also needs it for bundling sometimes)
            if (renderError.message.includes("ffmpeg") || renderError.message.includes("ENOENT")) {
                return NextResponse.json({
                    success: false,
                    error: "خطأ: ffmpeg غير مثبت على هذا الجهاز.",
                    technicalError: renderError.message
                }, { status: 500 });
            }

            throw renderError;
        }

    } catch (error: any) {
        console.error("Thumbnail API Error:", error);
        return NextResponse.json({
            success: false,
            error: "فشل إنشاء المعاينة.",
            technicalError: error.message
        }, { status: 500 });
    }
}
