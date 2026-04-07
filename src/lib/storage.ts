import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

function getClient(): S3Client {
  return new S3Client({
    endpoint: process.env.HETZNER_S3_ENDPOINT!,
    region: process.env.HETZNER_S3_REGION ?? "eu-central-1",
    credentials: {
      accessKeyId: process.env.HETZNER_S3_ACCESS_KEY!,
      secretAccessKey: process.env.HETZNER_S3_SECRET_KEY!,
    },
    forcePathStyle: true,
  });
}

/**
 * Upload a base64-encoded screenshot to Hetzner Object Storage.
 * Returns the public URL of the uploaded file.
 */
export async function uploadScreenshot(
  base64: string,
  projectSlug: string
): Promise<string> {
  const bucket = process.env.HETZNER_S3_BUCKET!;
  const publicBaseUrl = process.env.HETZNER_S3_PUBLIC_URL!;

  // Strip data URI prefix if present
  const data = base64.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(data, "base64");

  const key = `${projectSlug}/${randomUUID()}.png`;

  const client = getClient();
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: "image/png",
      ACL: "public-read",
    })
  );

  return `${publicBaseUrl}/${key}`;
}
