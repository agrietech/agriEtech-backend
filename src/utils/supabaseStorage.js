const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

const supabaseUrl = process.env.SUPABASE_URL || 'https://uhktbbeqqdsfkooyrgmq.supabase.co';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  'sb_publishable_toqBfJdLY2iLqZ0U3bSbbg_XOsOxSp3';

let supabaseClient = null;
if (supabaseUrl && supabaseKey) {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });
    logger.info(`[SupabaseStorage] Initialized client for ${supabaseUrl}`);
  } catch (err) {
    logger.warn(`[SupabaseStorage] Initialization warning: ${err.message}`);
  }
}

const knownBuckets = new Set();
async function ensureBucket(bucketName) {
  if (!supabaseClient || knownBuckets.has(bucketName)) return;
  try {
    const { data: buckets } = await supabaseClient.storage.listBuckets();
    const exists = (buckets || []).some((b) => b.name === bucketName);
    if (!exists) {
      await supabaseClient.storage.createBucket(bucketName, { public: true });
      logger.info(`[SupabaseStorage] Created public storage bucket '${bucketName}'`);
    }
    knownBuckets.add(bucketName);
  } catch (_e) {
    knownBuckets.add(bucketName);
  }
}

/**
 * Upload a local file to a Supabase storage bucket
 * Returns public CDN URL or signed URL for private buckets
 */
async function uploadToSupabase({ bucketName = 'diagnose', localFilePath, fileName, mimeType, isPrivate = false }) {
  const targetName = fileName || (localFilePath ? path.basename(localFilePath) : `file_${Date.now()}`);
  const fallbackUrl = `/uploads/${bucketName}/${targetName}`;

  if (!supabaseClient || !localFilePath || !fs.existsSync(localFilePath)) {
    return fallbackUrl;
  }

  try {
    await ensureBucket(bucketName);
    const fileBuffer = fs.readFileSync(localFilePath);
    const contentType =
      mimeType ||
      (targetName.endsWith('.jpg') || targetName.endsWith('.jpeg')
        ? 'image/jpeg'
        : targetName.endsWith('.png')
          ? 'image/png'
          : targetName.endsWith('.wav')
            ? 'audio/wav'
            : targetName.endsWith('.mp3')
              ? 'audio/mp3'
              : 'application/octet-stream');

    const { error } = await supabaseClient.storage.from(bucketName).upload(targetName, fileBuffer, {
      contentType,
      upsert: true,
    });

    if (error) {
      logger.warn(
        `[SupabaseStorage] Upload to bucket '${bucketName}' notice (${error.message}). Using local fallback.`
      );
      return fallbackUrl;
    }

    if (isPrivate || bucketName.toLowerCase().includes('private') || bucketName === 'agriEtech') {
      const { data: signedData } = await supabaseClient.storage
        .from(bucketName)
        .createSignedUrl(targetName, 60 * 60 * 24 * 7); // 7 days
      return signedData?.signedUrl || fallbackUrl;
    }

    const { data: publicData } = supabaseClient.storage.from(bucketName).getPublicUrl(targetName);
    const publicUrl = publicData?.publicUrl || fallbackUrl;
    logger.info(`[SupabaseStorage] File successfully hosted: ${publicUrl}`);
    return publicUrl;
  } catch (err) {
    logger.warn(`[SupabaseStorage] Upload exception (${err.message}). Using fallback URL.`);
    return fallbackUrl;
  }
}

/**
 * Upload buffer directly to Supabase storage
 */
async function uploadBufferToSupabase({ bucketName = 'diagnose', buffer, fileName, mimeType = 'image/jpeg', isPrivate = false }) {
  const fallbackUrl = `/uploads/${bucketName}/${fileName}`;
  if (!supabaseClient || !buffer) return fallbackUrl;

  try {
    const { error } = await supabaseClient.storage.from(bucketName).upload(fileName, buffer, {
      contentType: mimeType,
      upsert: true,
    });

    if (error) {
      logger.warn(`[SupabaseStorage] Buffer upload notice (${error.message})`);
      return fallbackUrl;
    }

    if (isPrivate || bucketName === 'agriEtech') {
      const { data: signedData } = await supabaseClient.storage
        .from(bucketName)
        .createSignedUrl(fileName, 60 * 60 * 24 * 7);
      return signedData?.signedUrl || fallbackUrl;
    }

    const { data: publicData } = supabaseClient.storage.from(bucketName).getPublicUrl(fileName);
    return publicData?.publicUrl || fallbackUrl;
  } catch (err) {
    logger.warn(`[SupabaseStorage] Buffer upload exception (${err.message})`);
    return fallbackUrl;
  }
}

module.exports = {
  supabaseClient,
  uploadToSupabase,
  uploadBufferToSupabase,
};
