import * as faceapi from "@vladmandic/face-api/dist/face-api.node-wasm.js";
import { loadImage, Canvas, Image, ImageData } from "canvas";
import fs from "fs";
 
faceapi.env.monkeyPatch({
  Canvas: Canvas as any,
  Image: Image as any,
  ImageData: ImageData as any,
});
 
const FACE_MATCH_THRESHOLD = 0.6;
 
export async function verifyIdentityFromPath(
  selfiePath: string,
  profilePath: string
): Promise<{ match: boolean; distance: number }> {
 
  if (!selfiePath || !profilePath) {
    throw new Error("Image paths are missing");
  }
 
  try {
 
    const selfieImg:any = await loadImage(selfiePath);
    const profileImg:any = await loadImage(profilePath);
 
    const selfieResult = await faceapi
      .detectSingleFace(selfieImg)
      .withFaceLandmarks()
      .withFaceDescriptor();
 
    if (!selfieResult) {
      throw new Error("No face detected in selfie image");
    }
 
    const profileResult = await faceapi
      .detectSingleFace(profileImg)
      .withFaceLandmarks()
      .withFaceDescriptor();
 
    if (!profileResult) {
      throw new Error("No face detected in profile image");
    }
 
    const distance = faceapi.euclideanDistance(
      selfieResult.descriptor,
      profileResult.descriptor
    );
 
    return {
      match: distance < FACE_MATCH_THRESHOLD,
      distance,
    };
  } finally {
 
    if (fs.existsSync(selfiePath)) fs.unlinkSync(selfiePath);
    if (fs.existsSync(profilePath)) fs.unlinkSync(profilePath);
  }
}