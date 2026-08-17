const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const controller = require('./farms.controller');
const validate = require('../../middleware/validate');
const { authenticate } = require('../../middleware/auth.middleware');

// POST /api/v1/farms – Register a new farm
router.post(
  '/',
  authenticate,
  [
    body('farmName')
      .trim()
      .notEmpty()
      .withMessage('farmName is required')
      .isLength({ max: 200 })
      .withMessage('farmName must be at most 200 characters'),
    body('woredaId')
      .trim()
      .notEmpty()
      .withMessage('woredaId is required')
      .isUUID()
      .withMessage('woredaId must be a valid UUID'),
    body('polygonGeojson')
      .isObject()
      .withMessage('polygonGeojson must be a GeoJSON object'),
    body('polygonGeojson.type')
      .exists()
      .withMessage('polygonGeojson.type is required')
      .isIn(['Polygon', 'Feature'])
      .withMessage('polygonGeojson.type must be "Polygon" or "Feature"'),
    body('polygonGeojson.coordinates')
      .if(body('polygonGeojson.type').equals('Polygon'))
      .isArray({ min: 1 })
      .withMessage('polygonGeojson.coordinates must be an array of rings'),
    body('primaryCrop')
      .optional()
      .isString()
      .trim()
      .notEmpty()
      .withMessage('primaryCrop must be a non-empty string'),
    body('areaHectares')
      .optional()
      .isFloat({ gt: 0 })
      .withMessage('areaHectares must be greater than zero'),
  ],
  validate,
  controller.createFarm
);

// GET /api/v1/farms – List farms for the authenticated user
router.get('/', authenticate, controller.getFarms);

// GET /api/v1/farms/:id – Get single farm details
router.get('/:id', authenticate, controller.getFarmDetails);

module.exports = router;
