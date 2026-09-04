const mediaService = require('./media.service');

async function uploadPublic(req, res, next) {
  try {
    const file = req.file;
    const result = await mediaService.uploadPublicMedia({ file, user: req.user });
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

async function uploadPrivate(req, res, next) {
  try {
    const file = req.file;
    const expiresIn = req.body.expiresInSeconds ? Number(req.body.expiresInSeconds) : undefined;
    const result = await mediaService.uploadPrivateAsset({
      file,
      user: req.user,
      expiresInSeconds: expiresIn,
    });
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

async function createSignedUrl(req, res, next) {
  try {
    const { filePath, expiresInSeconds } = req.body;
    const result = await mediaService.generatePrivateSignedUrl({
      filePath,
      expiresInSeconds: expiresInSeconds ? Number(expiresInSeconds) : undefined,
    });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  uploadPublic,
  uploadPrivate,
  createSignedUrl,
};
