import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Ensure public/uploads exists
        const uploadsDir = join(process.cwd(), 'public', 'uploads');
        if (!existsSync(uploadsDir)) {
            await mkdir(uploadsDir, { recursive: true });
        }

        // Save to public/uploads
        const filename = `audio_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
        const path = join(uploadsDir, filename);

        await writeFile(path, buffer);

        // Return the public URL
        return NextResponse.json({ success: true, url: `/uploads/${filename}` });

    } catch (error) {
        console.error("Audio Upload error:", error);
        return NextResponse.json({ success: false, error: 'Failed to upload audio file' }, { status: 500 });
    }
}
