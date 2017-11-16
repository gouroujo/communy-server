const moment = require('moment');

module.exports = async (event, params, { getField, logger }) => {
  try {
    const [
      endTime,
      startTime
    ] = await Promise.all([
      getField('endTime', event, 'Event'),
      getField('startTime', event, 'Event')
    ])
    return moment.duration(endTime - startTime).toISOString()
  } catch (e) {
    logger.error(e);
    return null;
  }
}
