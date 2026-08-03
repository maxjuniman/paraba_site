/** Lê e comprime imagem do input para data URL (JPEG). */
export async function fileToCompressedDataUrl(
  file: File,
  options?: { maxSide?: number; quality?: number }
): Promise<string> {
  const maxSide = options?.maxSide ?? 720;
  const quality = options?.quality ?? 0.72;

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(objectUrl);
    const { width, height } = fitWithin(image.naturalWidth, image.naturalHeight, maxSide);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Nao foi possivel processar a imagem.');
    ctx.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', quality);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function fitWithin(width: number, height: number, maxSide: number): { width: number; height: number } {
  if (width <= maxSide && height <= maxSide) return { width, height };
  if (width >= height) {
    return { width: maxSide, height: Math.round((height / width) * maxSide) };
  }
  return { width: Math.round((width / height) * maxSide), height: maxSide };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Nao foi possivel carregar a imagem.'));
    image.src = src;
  });
}
