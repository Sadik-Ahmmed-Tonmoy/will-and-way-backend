// import { S3Client, S3ClientConfig, ObjectCannedACL } from "@aws-sdk/client-s3";
// import { Upload } from "@aws-sdk/lib-storage";
// import path from "path";
// import fs from "fs";
// import ApiError from "../errors/ApiErrors";
 
// const DO_CONFIG = {
//   endpoint: "https://nyc3.digitaloceanspaces.com",
//   region: "nyc3",
//   credentials: {
//     accessKeyId: "DO002RGDJ947DJHJ9WDT",
//     secretAccessKey: "e5+/pko6Ojar51Hb8ojUKfq2HtXy+tnGKOfs3rIcEfo",
//   },
//   spaceName: "smtech-space",
// };
 
// const s3Config: S3ClientConfig = {
//   endpoint: DO_CONFIG.endpoint,
//   region: DO_CONFIG.region,
//   credentials: DO_CONFIG.credentials,
//   forcePathStyle: true,
// };
 
// const s3 = new S3Client(s3Config);
// const MAX_FILE_SIZE = 400 * 1024 * 1024; // 400MB
 
// const uploadToDigitalOcean = async (file: Express.Multer.File): Promise<string> => {
//   try {
//     if (!file) throw new ApiError(400, "No file provided");
 
//     if (file.size > MAX_FILE_SIZE) {
//       throw new ApiError(400, `File size exceeds maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
//     }
 
//     const mimeType = file.mimetype || "application/octet-stream";
//     const fileExtension = path.extname(file.originalname) || "";
//     const fileName = `uploads/${Date.now()}-${Math.random().toString(36).substring(2, 15)}${fileExtension}`;
 
//     const uploadParams = {
//       Bucket: DO_CONFIG.spaceName,
//       Key: fileName,
//       Body: fs.createReadStream(file.path), // ⬅️ Read from disk
//       ACL: "public-read" as ObjectCannedACL,
//       ContentType: mimeType,
//     };
 
//     const upload = new Upload({ client: s3, params: uploadParams });
//     const data = await upload.done();
 
//     // Delete temp file after upload
//     fs.unlink(file.path, (err) => {
//       if (err) console.error("Failed to delete temp file:", err);
//     });
 
//     const fileUrlRaw = data.Location || `${DO_CONFIG.endpoint}/${DO_CONFIG.spaceName}/${fileName}`;
//     return fileUrlRaw.startsWith("http") ? fileUrlRaw : `https://${fileUrlRaw}`;
//   } catch (error) {
//     console.log(error, "check error");
//     throw new ApiError(500, error instanceof Error ? `Failed to upload file: ${error.message}` : "Failed to upload file to DigitalOcean Spaces");
//   }
// };
 
// export default uploadToDigitalOcean;

import { S3Client, S3ClientConfig, ObjectCannedACL } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import path from "path";
import fs from "fs";
import ApiError from "../errors/ApiErrors";
 
// MinIO config
const MINIO_CONFIG = {
  endpoint: "https://api.zenexcloud.com:443", // add the correct API port
  region: "us-east-1",
  credentials: {
    accessKeyId: "Be7vSXLGn1EuMzy55jLO",
    secretAccessKey: "Gw2pW1gqVAG0GH8SXzrRJXi1036IMv5dBdgcwJme",
  },
  bucketName: "emdadullah",
  apiVersion: "s3v4",
};
 
 
const s3Config: S3ClientConfig = {
  endpoint: MINIO_CONFIG.endpoint || "https://api.zenexcloud.com:443",
  region: MINIO_CONFIG.region || "us-east-1",
  credentials: MINIO_CONFIG.credentials || {
    accessKeyId: "Be7vSXLGn1EuMzy55jLO",
    secretAccessKey: "Gw2pW1gqVAG0GH8SXzrRJXi1036IMv5dBdgcwJme",
  },
  forcePathStyle: true, // must be true for MinIO
};
 
const s3 = new S3Client(s3Config);
const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB
 
const uploadToDigitalOcean = async (file: Express.Multer.File): Promise<string> => {
  try {
    if (!file) throw new ApiError(400, "No file provided");
 
    if (file.size > MAX_FILE_SIZE) {
      throw new ApiError(
        400,
        `File size exceeds maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`
      );
    }
 
    const mimeType = file.mimetype || "application/octet-stream";
    const fileExtension = path.extname(file.originalname) || "";
    const fileName = `uploads/${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 15)}${fileExtension}`;
 
    const uploadParams = {
      Bucket: MINIO_CONFIG.bucketName,
      Key: fileName,
      Body: fs.createReadStream(file.path),
      ACL: "public-read" as ObjectCannedACL, // optional
      ContentType: mimeType,
    };
 
    const upload = new Upload({ client: s3, params: uploadParams });
    const data = await upload.done();
 
    // Delete temp file after upload
    fs.unlink(file.path, (err) => {
      if (err) console.error("Failed to delete temp file:", err);
    });
 
    const fileUrlRaw =
      data.Location || `${MINIO_CONFIG.endpoint}/${MINIO_CONFIG.bucketName}/${fileName}`;
    return fileUrlRaw.startsWith("http") ? fileUrlRaw : `https://${fileUrlRaw}`;
  } catch (error) {
    console.log(error, "check error");
    throw new ApiError(
      500,
      error instanceof Error
        ? `Failed to upload file: ${error.message}`
        : "Failed to upload file to MinIO"
    );
  }
};
 
export default uploadToDigitalOcean;
 
 