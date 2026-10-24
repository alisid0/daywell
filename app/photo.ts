"use client";

// A photo made small enough to send for reading: at most 1600 pixels on its longest side, as a JPEG.
export async function shrinkPhoto(file: File, name: string) {
  const bitmap = await createImageBitmap(file), scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas"); canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close();
  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/jpeg", .85));
  if (!blob) throw Error("Couldn’t open that photo. Try another one.");
  return new File([blob], name, { type: "image/jpeg" });
}
// Photos the readers accept, before shrinking.
export const photoProblem = (file: File) => !/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > 15 * 1024 * 1024 ? "Choose a JPEG, PNG or WebP photo under 15 MB." : "";
