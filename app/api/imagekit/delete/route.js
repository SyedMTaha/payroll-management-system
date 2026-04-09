import { NextResponse } from 'next/server';

const IMAGEKIT_DELETE_URL = 'https://api.imagekit.io/v1/files';
export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const { fileId, filePath } = await request.json();

    if (!fileId && !filePath) {
      return NextResponse.json({ error: 'fileId or filePath is required.' }, { status: 400 });
    }

    const privateApiKey = process.env.IMAGEKIT_PRIVATE_API_KEY;
    if (!privateApiKey) {
      return NextResponse.json({ error: 'ImageKit private API key is not configured.' }, { status: 500 });
    }

    const target = fileId ? encodeURIComponent(fileId) : '';
    const response = await fetch(`${IMAGEKIT_DELETE_URL}/${target}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Basic ${Buffer.from(`${privateApiKey}:`).toString('base64')}`,
      },
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: payload?.message || payload?.error || 'ImageKit delete failed.' },
        { status: response.status }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('ImageKit delete error:', error);
    return NextResponse.json({ error: 'Failed to delete file from ImageKit.' }, { status: 500 });
  }
}