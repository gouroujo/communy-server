const config = require('../config');
const { get } = require('axios');
const { omit, values } = require('lodash');

module.exports = function (address, language) {
  const text = address.fulltext ? address.fulltext : values(omit(address, ['title', 'fulltext', 'country_code'])).toString()
  return Promise.resolve()
  .then(() => get('https://api.opencagedata.com/geocode/v1/json', {
      params: {
        key: config.get('OPENCAGE_KEY'),
        q: text,
        no_annotations: 1,
        language,
        countrycode: address.country_code,
        limit: 1,
        min_confidence: 7,
      },
      timeout: 1500
    })
  )
  .then(response => {
    const result = response.data.results[0];
    if (!result) return null;
    return {
      road: result.components.road,
      postcode: result.components.postcode,
      city: result.components.city,
      country: result.components.countr,
      country_code: result.components.country_code,
      location: {
        type: "Point",
        coordinates: [result.geometry.lng, result.geometry.lat],
      },
      fulltext: result.formatted,
    }
  })
  .catch(e => {
    console.log(e);
    return null;
  })
}
