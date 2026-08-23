const { BadRequestError } = require('../utils/errors');

/**
 * Input validation schemas for critical endpoints
 */

function validateFarmData(data) {
  const errors = [];
  
  if (!data || !(data.farmName || data.name || data.title) || typeof (data.farmName || data.name || data.title) !== 'string' || (data.farmName || data.name || data.title).trim().length < 2) {
    errors.push('Farm name must be at least 2 characters');
  }
  
  if (data.farmName && data.farmName.length > 100) {
    errors.push('Farm name must not exceed 100 characters');
  }
  
  const areaVal = data?.areaHectares !== undefined ? data.areaHectares : (data?.size !== undefined ? data.size : data?.area);
  if (areaVal !== undefined && areaVal !== null) {
    const area = parseFloat(areaVal);
    if (isNaN(area) || area < 0.01 || area > 100000) {
      errors.push('Area must be between 0.01 and 100,000 hectares');
    }
  }
  
  const latVal = data?.latitude !== undefined ? data.latitude : data?.lat;
  if (latVal !== undefined && latVal !== null) {
    const lat = parseFloat(latVal);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      errors.push('Latitude must be between -90 and 90 degrees');
    }
  }
  
  const lngVal = data?.longitude !== undefined ? data.longitude : (data?.lng !== undefined ? data.lng : data?.lon);
  if (lngVal !== undefined && lngVal !== null) {
    const lng = parseFloat(lngVal);
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
