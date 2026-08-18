// Client-side resize at upload time: three sizes, WebP, dimensions captured.
// Keeps the free tier free and the gallery fast.

const SIZES = { sm: 480, md: 1280, lg: 2200 };

async function fileToBitmap(file) {
  return await createImageBitmap(file);
}

function resizeToBlob(bitmap, maxW, quality = 0.85) {
  const scale = Math.min(1, maxW / bitmap.width);
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d").drawImage(bitmap, 0, 0, w, h);
  return new Promise((resolve) =>
    canvas.toBlob((b) => resolve({ blob: b, width: w, height: h }), "image/webp", quality)
  );
}

export async function prepareUpload(file) {
  const bitmap = await fileToBitmap(file);
  const sm = await resizeToBlob(bitmap, SIZES.sm, 0.8);
  const md = await resizeToBlob(bitmap, SIZES.md, 0.85);
  const lg = await resizeToBlob(bitmap, SIZES.lg, 0.87);
  bitmap.close();
  return { sm, md, lg, width: lg.width, height: lg.height };
}
