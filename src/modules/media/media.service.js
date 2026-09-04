const fs = require('fs');
const path = require('path');
const logger = require('../../utils/logger');
const {
  BUCKETS,
  uploadAgrEtechMedia,
  uploadPrivateDocument,
  getSignedUrl,
  deleteFromSupabase,
} = require('../../utils/supabaseStorage');
const { BadRequestError } = require('../../utils/errors');

/**
 * Upload a public file (image/media/advisory document) to the 'agrEtech' Supabase bucket.
 */
async function uploadPublicMedia({ file, user }) {
  if (!file || !file.path) {
    throw new BadRequestError('No file provided for upload');
  }

  const fileName = `media_${Date.now()}_${path.basename(file.path)}`;
  try {
    const publicUrl = await uploadAgrEtechMedia({
      localFilePath: file.path,
      fileName,
      mimeType: file.mimetype,
    });

    // Cleanup ephemeral local container file
    try { fs.unlinkSync(file.path); } catch (_e) {}

    return {
      bucket: BUCKETS.AGRETECH,
      url: publicUrl,
      fileName,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      uploadedBy: user?.id || null,
      isPrivate: false,
    };
  } catch (err) {
    try { fs.unlinkSync(file.path); } catch (_e) {}
    logger.error(`[MediaService] Public upload failed: ${err.message}`);
    throw err;
  }
}

/**
 * Upload a confidential/private file (soil report, contract, diagnostic export) to the 'private' Supabase bucket.
 * Generates a signed URL.
 */
async function uploadPrivateAsset({ file, user, expiresInSeconds = 60 * 60 * 24 * 7 }) {
  if (!file || !file.path) {
    throw new BadRequestError('No file provided for upload');
  }

  const userPrefix = user?.id ? `user_${user.id}/` : '';
  const fileName = `${userPrefix}doc_${Date.now()}_${path.basename(file.path)}`;

  try {
    const signedUrl = await uploadPrivateDocument({
      localFilePath: file.path,
      fileName,
      mimeType: file.mimetype,
      expiresInSeconds,
    });

    // Cleanup ephemeral local container file
    try { fs.unlinkSync(file.path); } catch (_e) {}

    return {
      bucket: BUCKETS.PRIVATE,
      signedUrl,
      filePath: fileName,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      uploadedBy: user?.id || null,
      isPrivate: true,
      expiresIn: `${expiresInSeconds}s`,
    };
  } catch (err) {
    try { fs.unlinkSync(file.path); } catch (_e) {}
    logger.error(`[MediaService] Private upload failed: ${err.message}`);
    throw err;
  }
}

/**
 * Create a new signed URL for an existing private asset
 */
async function generatePrivateSignedUrl({ filePath, expiresInSeconds = 60 * 60 * 24 * 7 }) {
  if (!filePath) {
    throw new BadRequestError('filePath is required to generate signed URL');
  }

  const signedUrl = await getSignedUrl(BUCKETS.PRIVATE, filePath, expiresInSeconds);
  if (!signedUrl) {
    throw new BadRequestError('Could not generate signed URL for the requested file');
  }

  return {
    bucket: BUCKETS.PRIVATE,
    filePath,
    signedUrl,
    expiresInSeconds,
  };
}

module.exports = {
  uploadPublicMedia,
  uploadPrivateAsset,
  generatePrivateSignedUrl,
  deleteMedia: (filePath, bucket = BUCKETS.AGRETECH) => deleteFromSupabase(bucket, filePath),
};
