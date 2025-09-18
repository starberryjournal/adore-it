import { storage } from "../appwrite";

const buketPost = import.meta.env.VITE_BUCKET_POST;

export async function processImageInput(
  inputFile: File | null,
  imageUrl: string | null
): Promise<{ fileId: string; fileName: string }> {
  let blob: Blob;
  let mimeType = "";

  if (imageUrl) {
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error("Failed to fetch image URL");
    mimeType = response.headers.get("Content-Type") || "";
    blob = await response.blob();

    if (mimeType.includes("image/gif")) {
      const img = new Image();
      img.src = URL.createObjectURL(blob);

      await new Promise((resolve) => {
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");

          if (context) {
            canvas.width = img.width;
            canvas.height = img.height;
            context.drawImage(img, 0, 0);
            const pngDataUrl = canvas.toDataURL("image/png");

            fetch(pngDataUrl)
              .then((res) => res.blob())
              .then((pngBlob) => {
                blob = pngBlob;
                mimeType = "image/png";
                resolve(true);
              });
          } else {
            resolve(true);
          }
          URL.revokeObjectURL(img.src);
        };
      });
    }
  } else if (inputFile) {
    blob = inputFile;
    mimeType = inputFile.type;
  } else {
    throw new Error("No file or image URL provided");
  }

  const randomNumber = Math.floor(Math.random() * 1000000000);
  const extension = mimeType.includes("png") ? "png" : "jpg";
  const fileName = `image-${randomNumber}.${extension}`;
  const finalFile = new File([blob], fileName, { type: mimeType });

  const fileResponse = await storage.createFile(
    buketPost,
    "unique()",
    finalFile
  );
  return { fileId: fileResponse.$id, fileName };
}
