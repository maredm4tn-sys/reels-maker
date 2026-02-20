import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { audioUrl } = body;

        // Simulate Network Delay (AI processing time)
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Return dummy word-level timestamps (simulating Whisper API/Deepgram)
        const mockTranscription = [
            { text: "بسم", start: 0.1, end: 0.5 },
            { text: "الله", start: 0.6, end: 1.0 },
            { text: "الرحمن", start: 1.1, end: 1.6 },
            { text: "الرحيم", start: 1.7, end: 2.5 },
            { text: "الحمد", start: 3.0, end: 3.4 },
            { text: "لله", start: 3.5, end: 3.9 },
            { text: "رب", start: 4.0, end: 4.3 },
            { text: "العالمين", start: 4.4, end: 5.5 },
        ];

        return NextResponse.json({ success: true, words: mockTranscription });

    } catch (error) {
        console.error("Transcription Error:", error);
        return NextResponse.json({ success: false, error: "Failed to transcribe audio" }, { status: 500 });
    }
}
