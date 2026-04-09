import { NextResponse } from 'next/server';

const IMAGEKIT_UPLOAD_URL = 'https://upload.imagekit.io/api/v1/files/upload';
const MAX_LOGO_SIZE_BYTES = 5 * 1024 * 1024;
export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const fileName = formData.get('fileName');
    const folder = formData.get('folder');

    if (!file || !fileName) {
      return NextResponse.json({ error: 'file and fileName are required.' }, { status: 400 });
    }

    if (typeof file.size === 'number' && file.size > MAX_LOGO_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'Logo file size must be 5 MB or less.' },
        { status: 400 }
      );
    }

    const privateApiKey = process.env.IMAGEKIT_PRIVATE_API_KEY;
    if (!privateApiKey) {
      return NextResponse.json({ error: 'ImageKit private API key is not configured.' }, { status: 500 });
    }

    const uploadForm = new FormData();
    uploadForm.append('file', file);
    uploadForm.append('fileName', String(fileName));
    uploadForm.append('useUniqueFileName', 'true');

    // Prevent ImageKit free-plan resolution-limit delivery errors by resizing huge source images on upload.
    if (file?.type?.startsWith('image/')) {
      uploadForm.append('transformation', JSON.stringify({ pre: 'w-1200,h-1200,c-at_max,q-85' }));
    }

    if (folder) {
      uploadForm.append('folder', String(folder));
    }

    const response = await fetch(IMAGEKIT_UPLOAD_URL, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${privateApiKey}:`).toString('base64')}`,
      },
      body: uploadForm,
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        { error: payload?.message || payload?.error || 'ImageKit upload failed.' },
        { status: response.status }
      );
    }

    return NextResponse.json({
      fileId: payload.fileId,
      filePath: payload.filePath,
      url: payload.url,
      thumbnailUrl: payload.thumbnailUrl,
      name: payload.name,
      size: payload.size,
    });
  } catch (error) {
    console.error('ImageKit upload error:', error);
    return NextResponse.json({ error: 'Failed to upload file to ImageKit.' }, { status: 500 });
  }
}