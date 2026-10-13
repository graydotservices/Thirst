export async function validateImageUpload(file: File) {
  if (file.size < 1 || file.size > 5 * 1024 * 1024) throw new Error('Choose an image up to 5 MB');
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const png = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  const jpg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const webp = String.fromCharCode(...bytes.slice(0,4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8,12)) === 'WEBP';
  const types: Record<string, boolean> = { 'image/png': png, 'image/jpeg': jpg, 'image/webp': webp };
  if (!types[file.type]) throw new Error('Choose a valid PNG, JPEG, or WebP image');
  return file.type === 'image/png' ? 'png' : file.type === 'image/jpeg' ? 'jpg' : 'webp';
}
