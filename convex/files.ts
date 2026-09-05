import { R2 } from "@convex-dev/r2";
import { components } from "./_generated/api";
import { query, mutation, action, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import type { DataModel } from "./_generated/dataModel";
import { api } from "./_generated/api";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

export const r2 = new R2(components.r2);

export const { generateUploadUrl, syncMetadata } = r2.clientApi<DataModel>({
  checkUpload: async () => {
    // Permission checks can be added here if needed
  },
});

/**
 * Resolves a public URL or signed URL for a file key or storage ID.
 */
export async function resolveMediaUrl(
  ctx: { storage: { getUrl: (id: any) => Promise<string | null> } },
  idOrKey: string | null | undefined
): Promise<string | null> {
  if (!idOrKey) return null;
  if (idOrKey.startsWith("http://") || idOrKey.startsWith("https://")) {
    return idOrKey;
  }

  const publicBase = process.env.R2_PUBLIC_URL || process.env.NEXT_PUBLIC_R2_URL;
  if (publicBase && !idOrKey.startsWith("kg2")) {
    return `${publicBase.replace(/\/$/, "")}/${idOrKey}`;
  }

  // If R2 credentials are configured in Convex environment, resolve via R2
  if (process.env.R2_BUCKET && process.env.R2_ACCESS_KEY_ID && !idOrKey.startsWith("kg2")) {
    try {
      const url = await r2.getUrl(idOrKey);
      if (url) return url;
    } catch (e) {
      console.warn("Failed to get R2 URL for:", idOrKey, e);
    }
  }

  // Fallback to Convex native storage
  try {
    return await ctx.storage.getUrl(idOrKey as any);
  } catch {
    return null;
  }
}

/**
 * Deletes a file from R2 or fallback Convex storage.
 */
export async function deleteMediaFile(
  ctx: any,
  idOrKey: string | null | undefined
) {
  if (!idOrKey || idOrKey.startsWith("http://") || idOrKey.startsWith("https://")) {
    return;
  }

  if (process.env.R2_BUCKET && process.env.R2_ACCESS_KEY_ID && !idOrKey.startsWith("kg2")) {
    try {
      await r2.deleteObject(ctx, idOrKey);
      return;
    } catch (e) {
      console.warn("Failed to delete R2 object for:", idOrKey, e);
    }
  }

  try {
    await ctx.storage.delete(idOrKey as any);
  } catch (e) {
    console.warn("Failed to delete from Convex storage:", idOrKey, e);
  }
}

/**
 * Query to get a file's resolved URL.
 */
export const getFileUrl = query({
  args: { storageId: v.string() },
  handler: async (ctx, args) => {
    return await resolveMediaUrl(ctx, args.storageId);
  },
});

// ==========================================
// MIGRATION HELPERS (Convex Storage -> R2)
// ==========================================

export const getFilesToMigrate = query({
  args: {},
  handler: async (ctx) => {
    const gallery = await ctx.db.query("gallery").collect();
    const executives = await ctx.db.query("executives").collect();
    const testimonials = await ctx.db.query("testimonials").collect();
    const businesses = await ctx.db.query("businesses").collect();
    const licenses = await ctx.db.query("licenses").collect();
    const globalSettings = await ctx.db.query("globalSettings").first();

    return {
      gallery: gallery.map((g) => ({ id: g._id, fileId: g.fileId })),
      executives: executives.map((e) => ({ id: e._id, imageId: e.imageId })),
      testimonials: testimonials.map((t) => ({ id: t._id, imageId: t.imageId, videoId: t.videoId })),
      businesses: businesses.map((b) => ({ id: b._id, imageId: b.imageId })),
      licenses: licenses.map((l) => ({ id: l._id, imageId: l.imageId })),
      globalSettings: globalSettings ? { id: globalSettings._id, heroImageId: globalSettings.heroImageId } : null,
    };
  },
});

export const getAllStorageFiles = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.system.query("_storage").collect();
  },
});

export const getStorageUrl = query({
  args: { storageId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId as any);
  },
});

export const patchMigratedRecord = mutation({
  args: {
    table: v.string(),
    id: v.string(),
    patch: v.any(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id as any, args.patch);
  },
});

/**
 * Action to migrate all files from Convex _storage to Cloudflare R2 bucket.
 * Run via: npx convex run files:migrateToR2
 */
export const migrateToR2 = action({
  args: {},
  handler: async (ctx) => {
    const bucket = process.env.R2_BUCKET || "wia-backups";
    const endpoint = process.env.R2_ENDPOINT;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

    if (!endpoint || !accessKeyId || !secretAccessKey) {
      throw new Error(
        "R2 environment variables are not set! Please set R2_ENDPOINT, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY."
      );
    }

    const s3 = new S3Client({
      region: "auto",
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    console.log(`🚀 Starting migration to Cloudflare R2 bucket: ${bucket}`);

    const data = await ctx.runQuery(api.files.getFilesToMigrate, {});
    const migratedMap = new Map<string, string>(); // storageId -> r2Key

    const uploadFileToR2 = async (storageId: string, prefix: string): Promise<string> => {
      if (migratedMap.has(storageId)) {
        return migratedMap.get(storageId)!;
      }

      // If it already looks like an R2 key (not starting with kg2), skip
      if (!storageId.startsWith("kg2")) {
        return storageId;
      }

      const fileUrl = await ctx.runQuery(api.files.getStorageUrl, { storageId });
      if (!fileUrl) {
        console.warn(`⚠️ Could not resolve storage URL for: ${storageId}`);
        return storageId;
      }

      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error(`Failed to download ${storageId}: ${response.statusText}`);
      }

      const contentType = response.headers.get("content-type") || "application/octet-stream";
      const buffer = new Uint8Array(await response.arrayBuffer());

      let ext = "bin";
      if (contentType.includes("jpeg") || contentType.includes("jpg")) ext = "jpg";
      else if (contentType.includes("png")) ext = "png";
      else if (contentType.includes("webp")) ext = "webp";
      else if (contentType.includes("mp4")) ext = "mp4";

      const key = `${prefix}/${storageId}.${ext}`;

      console.log(`📤 Uploading ${key} (${buffer.byteLength} bytes, ${contentType}) to R2...`);

      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: buffer,
          ContentType: contentType,
        })
      );

      migratedMap.set(storageId, key);
      return key;
    };

    // 1. Gallery
    for (const item of data.gallery) {
      if (item.fileId && item.fileId.startsWith("kg2")) {
        const newKey = await uploadFileToR2(item.fileId, "gallery");
        await ctx.runMutation(api.files.patchMigratedRecord, {
          table: "gallery",
          id: item.id,
          patch: { fileId: newKey },
        });
      }
    }

    // 2. Executives
    for (const exec of data.executives) {
      if (exec.imageId && exec.imageId.startsWith("kg2")) {
        const newKey = await uploadFileToR2(exec.imageId, "executives");
        await ctx.runMutation(api.files.patchMigratedRecord, {
          table: "executives",
          id: exec.id,
          patch: { imageId: newKey },
        });
      }
    }

    // 3. Testimonials
    for (const test of data.testimonials) {
      const patch: any = {};
      if (test.imageId && test.imageId.startsWith("kg2")) {
        patch.imageId = await uploadFileToR2(test.imageId, "testimonials");
      }
      if (test.videoId && test.videoId.startsWith("kg2")) {
        patch.videoId = await uploadFileToR2(test.videoId, "testimonials");
      }
      if (Object.keys(patch).length > 0) {
        await ctx.runMutation(api.files.patchMigratedRecord, {
          table: "testimonials",
          id: test.id,
          patch,
        });
      }
    }

    // 4. Businesses
    for (const bus of data.businesses) {
      if (bus.imageId && bus.imageId.startsWith("kg2")) {
        const newKey = await uploadFileToR2(bus.imageId, "businesses");
        await ctx.runMutation(api.files.patchMigratedRecord, {
          table: "businesses",
          id: bus.id,
          patch: { imageId: newKey },
        });
      }
    }

    // 5. Licenses
    for (const lic of data.licenses) {
      if (lic.imageId && lic.imageId.startsWith("kg2")) {
        const newKey = await uploadFileToR2(lic.imageId, "licenses");
        await ctx.runMutation(api.files.patchMigratedRecord, {
          table: "licenses",
          id: lic.id,
          patch: { imageId: newKey },
        });
      }
    }

    // 6. Global Settings
    if (data.globalSettings?.heroImageId && data.globalSettings.heroImageId.startsWith("kg2")) {
      const newKey = await uploadFileToR2(data.globalSettings.heroImageId, "settings");
      await ctx.runMutation(api.files.patchMigratedRecord, {
        table: "globalSettings",
        id: data.globalSettings.id,
        patch: { heroImageId: newKey },
      });
    }

    console.log(`✅ Successfully migrated ${migratedMap.size} unique media files to R2 bucket: ${bucket}!`);
    return {
      success: true,
      migratedCount: migratedMap.size,
      bucket,
    };
  },
});
