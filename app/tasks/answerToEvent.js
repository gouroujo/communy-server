const { models } = require('../db');
const { eventStatus } = require('../dict');

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
        _id: event._id,
        yes: {
          "$not": {
            "$elemMatch": { _id: user._id }
          }
        },
      }, {
        "$push": { yes: user },
        "$pull": { no: { _id: user._id } },
        "$pull": { mb: { _id: user._id } },
        "$inc": { nusers: 1 },
      });
    })
    .then(res => {
      if(res.ok !== 1) return new Error('Update error')
      return res;
    });
  },

  answerMaybeToEvent: (u, e) => {
    return Promise.all([
      minifyUser(u),
      minifyEvent(e)
    ])
    .then(([ user, event]) => {
      console.log(event)
      return models.Event.bulkWrite([
        {
          updateOne: {
            filter: {
              _id: event._id,
              yes: {
                "$elemMatch": { _id: user._id }
              }
            },
            update: {
              "$pull": { yes: { _id: user._id } },
              "$push": { mb: user },
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
                  "$elemMatch": { _id: user._id }
                }
              },
              mb: {
                "$not": {
                  "$elemMatch": { _id: user._id }
                }
              },
              // no: {
              //   "$elemMatch": { _id: user._id }
              // }
            },
            update: {
              "$push": { mb: user },
              "$pull": { no: { _id: user._id } },
            },
          }
        },
        // {
        //   updateOne: {
        //     filter: {
        //       _id: event._id,
        //       yes: {
        //         "$not": {
        //           "$elemMatch": { _id: user._id }
        //         }
        //       },
        //       mb: {
        //         "$not": {
        //           "$elemMatch": { _id: user._id }
        //         }
        //       },
        //       no: {
        //         "$not": {
        //           "$elemMatch": { _id: user._id }
        //         }
        //       },
        //     },
        //     update: {
        //       "$push": { mb: user },
        //     },
        //   }
        // }
      ]);
    })
    .then(res => {
      if(res.ok !== 1) return new Error('Bulk error')
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
              _id: event._id,
              yes: {
                "$elemMatch": { _id: user._id }
              }
            },
            update: {
              "$pull": { yes: { _id: user._id } },
              "$push": { no: user },
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
                  "$elemMatch": { _id: user._id }
                }
              },
              no: {
                "$not": {
                  "$elemMatch": { _id: user._id }
                }
              }
            },
            update: {
              "$push": { no: user },
              "$pull": { mb: { _id: user._id } },
            },
          }
        }
      ]);
    })
    .then(res => {
      if(res.ok !== 1) return new Error('Bulk error')
      return res;
    });
  },
}
