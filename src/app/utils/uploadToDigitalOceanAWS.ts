/* eslint-disable no-console */
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import config from '../../config';

const endpoint = process.env.DO_SPACE_ENDPOINT!;
const bucket = process.env.DO_SPACE_BUCKET!;
const accessKey = process.env.DO_SPACE_ACCESS_KEY!;
const secretKey = process.env.DO_SPACE_SECRET_KEY!;

const s3Client = new S3Client({
  region: "us-east-1",
  endpoint,
  forcePathStyle: true,
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretKey,
  },
});

// export const uploadToDigitalOceanAWS = async (
//  file: Express.Multer.File,
// ): Promise<UploadResponse> => {
  
//   try {
//     // Ensure the file exists before uploading
//     // await fs.promises.access(file.path, fs.constants.F_OK);

//     // const fileStream: Readable = fs.createReadStream(file.path);

//     // Prepare the upload command
//     const command = new PutObjectCommand({
//       Bucket: `${bucket}`,
//       Key: `${file.originalname}`,
//       Body: file.buffer,
//       ACL: 'public-read',
//       ContentType: file.mimetype,
//     });

//     // Execute the upload
//     await s3Client.send(command);

//     // Construct the direct URL to the uploaded file
//     const Location = `${endpoints}/${bucket}/${file.originalname}`;

//     return { Location };
//   } catch (error) {
//     // eslint-disable-next-line no-console
//     console.error(`Error uploading file`, error);
//     throw error;
//   }
// };

export const deleteFromDigitalOceanAWS = async (fileUrl: string): Promise<void> => {
  try {
    if (!fileUrl) throw new Error("File URL is required");

    // Remove protocol
    let cleanUrl = fileUrl.replace(/^https?:\/\//, "");

    // Remove port if exists (like :443)
    const endpointHost = endpoint.replace(/^https?:\/\//, "").replace(/:\d+$/, "");

    // Remove endpoint host
    if (cleanUrl.startsWith(endpointHost)) {
      cleanUrl = cleanUrl.replace(endpointHost, "");
    }

    // Ensure leading slash removed
    cleanUrl = cleanUrl.replace(/^\//, "");

    // Remove bucket name prefix
    if (cleanUrl.startsWith(bucket + "/")) {
      cleanUrl = cleanUrl.replace(bucket + "/", "");
    }

    const key = cleanUrl;

    if (!key) {
      throw new Error("Could not extract object key from file URL");
    }

    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );

    console.log("Deleted:", key);
  } catch (error: any) {
    console.error("Delete failed:", error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
};
