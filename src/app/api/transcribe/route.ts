import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const apiKey = process.env.GROQ_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { success: false, error: "Missing GROQ_API_KEY in environment variables. Please add it to .env.local" },
                { status: 401 }
            );
        }

        const formData = await req.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ success: false, error: "No audio file provided" }, { status: 400 });
        }

        // Prepare the payload for Groq's Whisper API
        const groqFormData = new FormData();
        groqFormData.append('file', file);
        groqFormData.append('model', 'whisper-large-v3');
        groqFormData.append('response_format', 'verbose_json');

        // Use array syntax for timestamp_granularities
        groqFormData.append('timestamp_granularities[]', 'word');

        // Note: We use the native fetch to proxy the request
        const apiResponse = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
            },
            body: groqFormData
        });

        if (!apiResponse.ok) {
            const errorText = await apiResponse.text();
            console.error("Groq API Error:", errorText);
            return NextResponse.json({ success: false, error: `Groq API Error: ${apiResponse.statusText}` }, { status: apiResponse.status });
        }

        const data = await apiResponse.json();

        // Map Groq's word format to our application's expected WordTimestamp format
        if (data && data.words && Array.isArray(data.words)) {
            const mappedWords = data.words.map((w: any) => ({
                text: w.word.trim(),
                start: parseFloat(w.start.toFixed(2)),
                end: parseFloat(w.end.toFixed(2))
            }));

            return NextResponse.json({ success: true, words: mappedWords });
        } else {
            return NextResponse.json({ success: false, error: "No word-level timestamps returned by the API" }, { status: 500 });
        }

    } catch (error) {
        console.error("Transcription Error:", error);
        return NextResponse.json({ success: false, error: "Failed to transcribe audio" }, { status: 500 });
    }
}

