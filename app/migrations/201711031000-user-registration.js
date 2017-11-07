const { models } = require('../db');

module.exports = function() {
  return models.User.find({
    "organisations": { $exists: true }
  })
  .then(users => {
    return Promise.all(users.map(user => {
      const organisations = user.get("organisations");
      if (organisations) {
        return Promise.all(organisations.map(async o => {
          const registration = await models.Registration.findOne({
            "organisation._id": o._id,
            "user._id": user._id,
          });
          const organisation = await models.Organisation.findById(o._id);

          return {
            _id: registration._id,
            ack: registration.ack,
            confirm: registration.confirm,
            role: registration.role,
            organisation: {
              title: organisation.title,
              _id: organisation._id,
            }
          }
        }))
        .then(registrations => {
          user.set({ registrations });
          user.set('organisations', undefined, { strict: false });
          return user.save()
        })
      }
    }))
  })
}
