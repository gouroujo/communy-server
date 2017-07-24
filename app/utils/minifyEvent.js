const { models } = require('../db');

module.exports = function(event, options) {
  if (!event) return new Error('You must pass a event instance or a eventId to minify.')
  return ((event instanceof models.Event) ? Promise.resolve(event) : models.Event.findById(event).lean())
    .then(e => {
      if (!e) return new Error('Event Not Found');
      return Object.assign({
        ref: e._id,
        title: e.title,
        logo: e.logo,
        t: Date.now(),
      }, options);
    })
}
