const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

const supabaseUrl = process.env.SUPABASE_URL || 'https://uhktbbeqqdsfkooyrgmq.supabase.co';
// Prefer service role key for trusted backend storage operations to bypass client RLS policies
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  '';

// Existing Supabase Buckets (audio, diagnose, agrEtech are public; private is private)
const BUCKETS = {
  AUDIO: process.env.SUPABASE_BUCKET_AUDIO || 'audio',
  DIAGNOSE: process.env.SUPABASE_BUCKET_DIAGNOSE || 'diagnose',
  AGRETECH: process.env.SUPABASE_BUCKET_AGRETECH || 'agrEtech',
  PRIVATE: process.env.SUPABASE_BUCKET_PRIVATE || 'private',
};

const PRIVATE_BUCKETS = new Set([BUCKETS.PRIVATE, 'private']);

let supabaseClient = null;
if (supabaseUrl && supabaseKey) {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });
    const keyType = process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SERVICE_ROLE' : 'ANON';
    logger.info(`[SupabaseStorage] Initialized client for ${supabaseUrl} (keyType=${keyType})`);
  } catch (err) {
    logger.warn(`[SupabaseStorage] Initialization warning: ${err.message}`);
  }
} else {
  logger.info('[SupabaseStorage] Remote Supabase key not configured; uploads will use authenticated local storage.');
}

const knownBuckets = new Set();
async function ensureBucket(bucketName) {
  if (!supabaseClient || knownBuckets.has(bucketName)) return;
  try {
    const { data: buckets } = await supabaseClient.storage.listBuckets();
    const exists = (buckets || []).some((b) => b.name === bucketName);
    if (!exists) {
      const isPriv = PRIVATE_BUCKETS.has(bucketName);
      await supabaseClient.storage.createBucket(bucketName, { public: !isPriv });
      logger.info(`[SupabaseStorage] Verified/created storage bucket '${bucketName}' (public=${!isPriv})`);
    }
    knownBuckets.add(bucketName);
  } catch (_e) {
    knownBuckets.add(bucketName);
  }
}

function resolveContentType(targetName, mimeType) {
  if (mimeType) return mimeType;
  const ext = path.extname(targetName).toLowerCase();
  const map = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.wav': 'audio/wav',
    '.mp3': 'audio/mp3',
    '.m4a': 'audio/m4a',
    '.ogg': 'audio/ogg',
    '.json': 'application/json',
    '.pdf': 'application/pdf',
  };
  return map[ext] || 'application/octet-stream';
}

/**
 * Upload a local file to a Supabase storage bucket
 * Returns public CDN URL for public buckets or signed URL for private bucket
 */
async function uploadToSupabase({
  bucketName = BUCKETS.DIAGNOSE,
  localFilePath,
  fileName,
  mimeType,
  isPrivate = false,
}) {
  const targetName = fileName || (localFilePath ? path.basename(localFilePath) : `file_${Date.now()}`);
  const fallbackUrl = `/uploads/${bucketName}/${targetName}`;

  if (!supabaseClient || !localFilePath || !fs.existsSync(localFilePath)) {
    return fallbackUrl;
  }

  try {
    await ensureBucket(bucketName);
    const fileBuffer = fs.readFileSync(localFilePath);
    const contentType = resolveContentType(targetName, mimeType);

    const { error } = await supabaseClient.storage.from(bucketName).upload(targetName, fileBuffer, {
      contentType,
      upsert: true,
    });

    if (error) {
      logger.warn(`[SupabaseStorage] Upload to bucket '${bucketName}' notice (${error.message}). Using fallback.`);
      return fallbackUrl;
    }

    const requiresSignature = isPrivate || PRIVATE_BUCKETS.has(bucketName);
    if (requiresSignature) {
      const { data: signedData, error: signErr } = await supabaseClient.storage
        .from(bucketName)
        .createSignedUrl(targetName, 60 * 60 * 24 * 7); // 7 days validity
      if (signErr) {
        logger.warn(`[SupabaseStorage] Signed URL notice for '${targetName}': ${signErr.message}`);
        return fallbackUrl;
      }
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
 * Upload buffer directly to Supabase storage without writing to local disk
 */
async function uploadBufferToSupabase({
  bucketName = BUCKETS.DIAGNOSE,
  buffer,
  fileName,
  mimeType = 'image/jpeg',
  isPrivate = false,
}) {
  const targetName = fileName || `buffer_${Date.now()}`;
  const fallbackUrl = `/uploads/${bucketName}/${targetName}`;
  if (!supabaseClient || !buffer) return fallbackUrl;

  try {
    await ensureBucket(bucketName);
    const contentType = resolveContentType(targetName, mimeType);

    const { error } = await supabaseClient.storage.from(bucketName).upload(targetName, buffer, {
      contentType,
      upsert: true,
    });

    if (error) {
      logger.warn(`[SupabaseStorage] Buffer upload notice for '${targetName}' (${error.message})`);
      return fallbackUrl;
    }

    const requiresSignature = isPrivate || PRIVATE_BUCKETS.has(bucketName);
    if (requiresSignature) {
      const { data: signedData, error: signErr } = await supabaseClient.storage
        .from(bucketName)
        .createSignedUrl(targetName, 60 * 60 * 24 * 7);
      if (signErr) return fallbackUrl;
      return signedData?.signedUrl || fallbackUrl;
    }

    const { data: publicData } = supabaseClient.storage.from(bucketName).getPublicUrl(targetName);
    const publicUrl = publicData?.publicUrl || fallbackUrl;
    logger.info(`[SupabaseStorage] Buffer successfully hosted: ${publicUrl}`);
    return publicUrl;
  } catch (err) {
    logger.warn(`[SupabaseStorage] Buffer upload exception (${err.message})`);
    return fallbackUrl;
  }
}

/**
 * Delete one or more files from a Supabase bucket
 */
async function deleteFromSupabase(bucketName, filePaths = []) {
  if (!supabaseClient || !filePaths || filePaths.length === 0) return false;
  try {
    const paths = Array.isArray(filePaths) ? filePaths : [filePaths];
    const { error } = await supabaseClient.storage.from(bucketName).remove(paths);
    if (error) {
      logger.warn(`[SupabaseStorage] Delete error: ${error.message}`);
      return false;
    }
    return true;
  } catch (err) {
    logger.warn(`[SupabaseStorage] Delete exception: ${err.message}`);
    return false;
  }
}

/**
 * Convenience helper: Upload diagnosis photo to 'diagnose' bucket
 */
async function uploadDiagnosisPhoto({ buffer, localFilePath, fileName, mimeType }) {
  if (buffer) {
    return uploadBufferToSupabase({
      bucketName: BUCKETS.DIAGNOSE,
      buffer,
      fileName,
      mimeType: mimeType || 'image/jpeg',
      isPrivate: false,
    });
  }
  return uploadToSupabase({
    bucketName: BUCKETS.DIAGNOSE,
    localFilePath,
    fileName,
    mimeType,
    isPrivate: false,
  });
}

/**
 * Convenience helper: Upload voice inquiry to 'audio' bucket
 */
async function uploadVoiceAudio({ buffer, localFilePath, fileName, mimeType }) {
  if (buffer) {
    return uploadBufferToSupabase({
      bucketName: BUCKETS.AUDIO,
      buffer,
      fileName,
      mimeType: mimeType || 'audio/wav',
      isPrivate: false,
    });
  }
  return uploadToSupabase({
    bucketName: BUCKETS.AUDIO,
    localFilePath,
    fileName,
    mimeType,
    isPrivate: false,
  });
}

/**
 * Convenience helper: Upload general public media to 'agrEtech' bucket
 */
async function uploadAgrEtechMedia({ buffer, localFilePath, fileName, mimeType }) {
  if (buffer) {
    return uploadBufferToSupabase({
      bucketName: BUCKETS.AGRETECH,
      buffer,
      fileName,
      mimeType: mimeType || 'image/jpeg',
      isPrivate: false,
    });
  }
  return uploadToSupabase({
    bucketName: BUCKETS.AGRETECH,
    localFilePath,
    fileName,
    mimeType,
    isPrivate: false,
  });
}

/**
 * Convenience helper: Upload confidential document/export to 'private' bucket (signed URL)
 */
async function uploadPrivateDocument({ buffer, localFilePath, fileName, mimeType, expiresInSeconds = 60 * 60 * 24 * 7 }) {
  if (buffer) {
    return uploadBufferToSupabase({
      bucketName: BUCKETS.PRIVATE,
      buffer,
      fileName,
      mimeType: mimeType || 'application/pdf',
      isPrivate: true,
    });
  }
  return uploadToSupabase({
    bucketName: BUCKETS.PRIVATE,
    localFilePath,
    fileName,
    mimeType,
    isPrivate: true,
  });
}

/**
 * Generate a temporary signed URL for a file in a private bucket
 */
async function getSignedUrl(bucketName, filePath, expiresInSeconds = 60 * 60 * 24 * 7) {
  if (!supabaseClient || !filePath) return null;
  try {
    const { data, error } = await supabaseClient.storage
      .from(bucketName)
      .createSignedUrl(filePath, expiresInSeconds);
    if (error) {
      logger.warn(`[SupabaseStorage] Signed URL generation failed for '${filePath}': ${error.message}`);
      return null;
    }
    return data?.signedUrl || null;
  } catch (err) {
    logger.warn(`[SupabaseStorage] Signed URL exception for '${filePath}': ${err.message}`);
    return null;
  }
}

module.exports = {
  BUCKETS,
  supabaseClient,
  uploadToSupabase,
  uploadBufferToSupabase,
  deleteFromSupabase,
  uploadDiagnosisPhoto,
  uploadVoiceAudio,
  uploadAgrEtechMedia,
  uploadPrivateDocument,
  getSignedUrl,
};

