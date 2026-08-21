const { BadRequestError } = require('../utils/errors');

/**
 * Input validation schemas for critical endpoints
 */

function validateFarmData(data) {
  const errors = [];
  
  if (!data.farmName || typeof data.farmName !== 'string' || data.farmName.trim().length < 2) {
    errors.push('Farm name must be at least 2 characters');
  }
  
  if (data.farmName && data.farmName.length > 100) {
    errors.push('Farm name must not exceed 100 characters');
  }
  
  if (data.areaHectares !== undefined) {
    const area = parseFloat(data.areaHectares);
    if (isNaN(area) || area < 0.01 || area > 100000) {
      errors.push('Area must be between 0.01 and 100,000 hectares');
    }
  }
  
  if (data.latitude !== undefined) {
    const lat = parseFloat(data.latitude);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      errors.push('Latitude must be between -90 and 90 degrees');
    }
  }
  
  if (data.longitude !== undefined) {
    const lng = parseFloat(data.longitude);
    if (isNaN(lng) || lng < -180 || lng > 180) {
      errors.push('Longitude must be between -180 and 180 degrees');
    }
  }
  
  if (errors.length > 0) {
    throw new BadRequestError(`Validation failed: ${errors.join(', ')}`);
  }
  
  return true;
}

function validateUserData(data) {
  const errors = [];
  
  if (!data.fullName || typeof data.fullName !== 'string' || data.fullName.trim().length < 2) {
    errors.push('Full name must be at least 2 characters');
  }
  
  if (data.email && data.email.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email.trim())) {
      errors.push('Invalid email format');
    }
  }
  
  if (data.phoneNumber && data.phoneNumber.trim()) {
    const phoneRegex = /^\+?[\d\s\-()]{8,20}$/;
    if (!phoneRegex.test(data.phoneNumber.trim())) {
      errors.push('Invalid phone number format');
    }
  }
  
  if (!data.email && !data.phoneNumber) {
    errors.push('Either email or phone number is required');
  }
  
  if (errors.length > 0) {
    throw new BadRequestError(`Validation failed: ${errors.join(', ')}`);
  }
  
  return true;
}

function validateSensorData(data) {
  const errors = [];
  
  if (!data.hardwareId || typeof data.hardwareId !== 'string' || data.hardwareId.trim().length < 3) {
    errors.push('Hardware ID must be at least 3 characters');
  }
  
  if (data.soilMoisture !== undefined) {
    const moisture = parseFloat(data.soilMoisture);
    if (isNaN(moisture) || moisture < 0 || moisture > 100) {
      errors.push('Soil moisture must be between 0 and 100%');
    }
  }
  
  if (data.temperature !== undefined) {
    const temp = parseFloat(data.temperature);
    if (isNaN(temp) || temp < -50 || temp > 70) {
      errors.push('Temperature must be between -50 and 70°C');
    }
  }
  
  if (errors.length > 0) {
    throw new BadRequestError(`Validation failed: ${errors.join(', ')}`);
  }
  
  return true;
}

module.exports = {
  validateFarmData,
  validateUserData,
  validateSensorData,
};
