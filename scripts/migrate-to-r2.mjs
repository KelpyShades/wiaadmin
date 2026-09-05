import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://utmost-wombat-302.eu-west-1.convex.cloud";
const R2_BUCKET = "wia-backups";
const R2_ENDPOINT = "https://b3b2ab8f97691b74b33d72dc5f00ab54.r2.cloudflarestorage.com";
const R2_ACCESS_KEY_ID = "709ebbaf58d8f5260485de5b38f26630";
const R2_SECRET_ACCESS_KEY = "11a991c7ce2cd52f9f7eee084deb7180b8b8c21ca13bad73287b51494bd0c787";

console.log("🚀 Initializing migration to Cloudflare R2 bucket:", R2_BUCKET);
console.log("Convex URL:", CONVEX_URL);

const client = new ConvexHttpClient(CONVEX_URL);
const s3 = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

const migratedMap = new Map();

async function downloadWithRetry(fileUrl, storageId, maxRetries = 4) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`⬇️ Downloading ${storageId} from Convex storage (attempt ${attempt}/${maxRetries})...`);
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }
      const contentType = response.headers.get("content-type") || "application/octet-stream";
      const arrayBuffer = await response.arrayBuffer();
      return { buffer: Buffer.from(arrayBuffer), contentType };
    } catch (err) {
      console.warn(`⚠️ Attempt ${attempt} failed to download ${storageId}: ${err.message}`);
      if (attempt === maxRetries) throw err;
      await new Promise((res) => setTimeout(res, 2000 * attempt));
    }
  }
}

async function uploadFileToR2(storageId, prefix) {
  if (migratedMap.has(storageId)) {
    return migratedMap.get(storageId);
  }

  // If not a Convex storage ID (e.g. starts with "kg2"), already migrated or external
  if (!storageId.startsWith("kg2")) {
    return storageId;
  }

  const fileUrl = await client.query(api.files.getStorageUrl, { storageId });
  if (!fileUrl) {
    console.warn(`⚠️ Could not resolve storage URL for: ${storageId}`);
    return storageId;
  }

  const { buffer, contentType } = await downloadWithRetry(fileUrl, storageId);

  let ext = "bin";
  if (contentType.includes("jpeg") || contentType.includes("jpg")) ext = "jpg";
  else if (contentType.includes("png")) ext = "png";
  else if (contentType.includes("webp")) ext = "webp";
  else if (contentType.includes("mp4")) ext = "mp4";

  const key = `${prefix}/${storageId}.${ext}`;
  console.log(`📤 Uploading to R2: ${key} (${(buffer.length / (1024 * 1024)).toFixed(2)} MB, ${contentType})...`);

  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      await s3.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET,
          Key: key,
          Body: buffer,
          ContentType: contentType,
        })
      );
      break;
    } catch (err) {
      console.warn(`⚠️ Attempt ${attempt} failed to upload ${key} to R2: ${err.message}`);
      if (attempt === 4) throw err;
      await new Promise((res) => setTimeout(res, 2000 * attempt));
    }
  }

  migratedMap.set(storageId, key);
  return key;
}

async function run() {
  console.log("Fetching documents referencing files...");
  const data = await client.query(api.files.getFilesToMigrate, {});

  // 1. Gallery
  console.log(`Processing ${data.gallery.length} gallery items...`);
  for (const item of data.gallery) {
    if (item.fileId && item.fileId.startsWith("kg2")) {
      const newKey = await uploadFileToR2(item.fileId, "gallery");
      await client.mutation(api.files.patchMigratedRecord, {
        table: "gallery",
        id: item.id,
        patch: { fileId: newKey },
      });
    }
  }

  // 2. Executives
  console.log(`Processing ${data.executives.length} executives...`);
  for (const exec of data.executives) {
    if (exec.imageId && exec.imageId.startsWith("kg2")) {
      const newKey = await uploadFileToR2(exec.imageId, "executives");
      await client.mutation(api.files.patchMigratedRecord, {
        table: "executives",
        id: exec.id,
        patch: { imageId: newKey },
      });
    }
  }

  // 3. Testimonials
  console.log(`Processing ${data.testimonials.length} testimonials...`);
  for (const test of data.testimonials) {
    const patch = {};
    if (test.imageId && test.imageId.startsWith("kg2")) {
      patch.imageId = await uploadFileToR2(test.imageId, "testimonials");
    }
    if (test.videoId && test.videoId.startsWith("kg2")) {
      patch.videoId = await uploadFileToR2(test.videoId, "testimonials");
    }
    if (Object.keys(patch).length > 0) {
      await client.mutation(api.files.patchMigratedRecord, {
        table: "testimonials",
        id: test.id,
        patch,
      });
    }
  }

  // 4. Businesses
  console.log(`Processing ${data.businesses.length} businesses...`);
  for (const bus of data.businesses) {
    if (bus.imageId && bus.imageId.startsWith("kg2")) {
      const newKey = await uploadFileToR2(bus.imageId, "businesses");
      await client.mutation(api.files.patchMigratedRecord, {
        table: "businesses",
        id: bus.id,
        patch: { imageId: newKey },
      });
    }
  }

  // 5. Licenses
  console.log(`Processing ${data.licenses.length} licenses...`);
  for (const lic of data.licenses) {
    if (lic.imageId && lic.imageId.startsWith("kg2")) {
      const newKey = await uploadFileToR2(lic.imageId, "licenses");
      await client.mutation(api.files.patchMigratedRecord, {
        table: "licenses",
        id: lic.id,
        patch: { imageId: newKey },
      });
    }
  }

  // 6. Global Settings
  if (data.globalSettings?.heroImageId && data.globalSettings.heroImageId.startsWith("kg2")) {
    console.log("Processing global settings hero image...");
    const newKey = await uploadFileToR2(data.globalSettings.heroImageId, "settings");
    await client.mutation(api.files.patchMigratedRecord, {
      table: "globalSettings",
      id: data.globalSettings.id,
      patch: { heroImageId: newKey },
    });
  }

  // 7. Backup any remaining files in _storage
  console.log("Checking all files in Convex _storage...");
  const allStorage = await client.query(api.files.getAllStorageFiles, {});
  console.log(`Found ${allStorage.length} total files in Convex _storage.`);
  for (const file of allStorage) {
    if (!migratedMap.has(file._id)) {
      await uploadFileToR2(file._id, "backups");
    }
  }

  console.log(`\n🎉 SUCCESS! Migrated ${migratedMap.size} unique files to Cloudflare R2 bucket "${R2_BUCKET}"!`);
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
