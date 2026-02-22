import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Save to public/uploads
        const filename = `bg_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
        const path = join(process.cwd(), 'public', 'uploads', filename);

        await writeFile(path, buffer);

        // Return the public URL
        return NextResponse.json({ success: true, url: `/uploads/${filename}` });

    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ success: false, error: 'Failed to upload background media' }, { status: 500 });
    }
}
