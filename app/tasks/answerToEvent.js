const { models } = require('../db');
const { eventStatus } = require('../config');

const minifyUser = require('../utils/minifyUser');
const minifyEvent = require('../utils/minifyEvent');

module.exports = {

  answerYesToEvent: (u, e) => {
    return Promise.all([
      minifyUser(u),
      minifyEvent(e)
    ])
    .then(([ user, event ]) => {
      return models.Event.update({
        _id: event.ref,
        yes: {
          "$not": {
            "$elemMatch": { ref: user.ref }
          }
        },
      }, {
        "$push": { yes: user },
        "$pull": { no: { ref: user.ref } },
        "$pull": { maybe: { ref: user.ref } },
        "$inc": { nusers: 1 },
      });
    })
    .then(res => {
      if(!res.isOk()) return new Error('Update error')
      return res;
    });
  },

  answerMaybeToEvent: (u, e) => {
    return Promise.all([
      minifyUser(u),
      minifyEvent(e)
    ])
    .then(([ user, event]) => {
      return models.Event.bulkWrite([
        {
          updateOne: {
            filter: {
              _id: event.ref,
              yes: {
                "$elemMatch": { ref: user.ref }
              }
            },
            update: {
              "$pull": { yes: { ref: user.ref } },
              "$push": { maybe: user },
              "$inc": { nusers: -1 },
            }
          },
        },
        {
          updateOne: {
            filter: {
              _id: event._id,
              yes: {
                "$not": {
                  "$elemMatch": { ref: user.ref }
                }
              },
              maybe: {
                "$not": {
                  "$elemMatch": { ref: user.ref }
                }
              }
            },
            update: {
              "$push": { maybe: user },
              "$pull": { no: { ref: user.ref } },
            },
          }
        }
      ]);
    })
    .then(res => {
      if(!res.isOk()) return new Error('Bulk error')
      return res;
    });
  },


  answerNoToEvent: (u, e) => {
    return Promise.all([
      minifyUser(u),
      minifyEvent(e)
    ])
    .then(([user, event]) => {
      return models.Event.bulkWrite([
        {
          updateOne: {
            filter: {
              _id: event.ref,
              yes: {
                "$elemMatch": { ref: user.ref }
              }
            },
            update: {
              "$pull": { yes: { ref: user.ref } },
              "$push": { no: user },
              "$inc": { nusers: -1 },
            }
          },
        },
        {
          updateOne: {
            filter: {
              _id: event.ref,
              yes: {
                "$not": {
                  "$elemMatch": { ref: user.ref }
                }
              },
              no: {
                "$not": {
                  "$elemMatch": { ref: user.ref }
                }
              }
            },
            update: {
              "$push": { no: user },
              "$pull": { maybe: { ref: user.ref } },
            },
          }
        }
      ]);
    })
    .then(res => {
      if(!res.isOk()) return new Error('Bulk error')
      return res;
    });
  },
}
