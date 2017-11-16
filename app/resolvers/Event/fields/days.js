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
    let start = moment(startTime).hours(0).minutes(0).seconds(0).milliseconds(0);
    const end = moment(endTime);
    const dateArray = [];
    while (start < end) {
      dateArray.push(start.format('YYYYMMDD'));
      start = start.clone().add(1, 'day');
    }
    return dateArray;
  } catch (e) {
    logger.error(e);
    return null;
  }
}
