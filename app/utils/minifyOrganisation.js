const { models } = require('../db');

module.exports = function(organisation, options) {
  if (!organisation) return new Error('You must pass a organisation instance or a organisationId to minify.')
  return ((organisation instanceof models.Organisation) ? Promise.resolve(organisation) : models.Organisation.findById(organisation).lean())
    .then(o => {
      if (!o) return new Error('Organisation Not Found');
      return Object.assign({
        ref: o._id,
        title: o.title,
        logo: o.logo,
        t: Date.now(),
      }, options);
    })
}
