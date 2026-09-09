const weatherService = require('./weather.service');

/**
 * Weather Controller
 */

async function getForecast(req, res, next) {
  try {
    const user = req.user || {};
    const { woredaId, lat, lng, days } = req.query;

    // Use requested woredaId, user's assigned woredaId, or national fallback
    const targetWoredaId = woredaId || user.woredaId || null;
    const targetLat = lat || null;
    const targetLng = lng || null;

    const data = await weatherService.getWeatherForecast({
      woredaId: targetWoredaId,
      lat: targetLat,
      lng: targetLng,
      days: days || 7,
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function getCurrentWeather(req, res, next) {
  try {
    const user = req.user || {};
    const { woredaId, lat, lng } = req.query;

    const targetWoredaId = woredaId || user.woredaId || null;
    const forecast = await weatherService.getWeatherForecast({
      woredaId: targetWoredaId,
      lat: lat || null,
      lng: lng || null,
      days: 1,
    });

    res.status(200).json({
      success: true,
      data: {
        location: forecast.location,
        current: forecast.current,
        dataSources: forecast.dataSources,
        timestamp: forecast.timestamp,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getForecast,
  getCurrentWeather,
};
