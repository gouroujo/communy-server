const { mongoose, models } = require('./db');
const DataLoader = require('dataloader');

function createLoaderFor(model) {
  return new DataLoader(ids => {
    const castedIds = ids
      .map(id => mongoose.Types.ObjectId(id))
    return model.aggregate([
      {$match: {_id: {$in: castedIds}}},
      {$addFields: {"__order": {$indexOfArray: [castedIds, "$_id" ]}}},
      {$sort: {"__order": 1}}
    ])
    .then(results => {
      let offset = 0;
      return ids.map((id, i) => {
        if (results[i + offset] && (String(id) === String(results[i + offset]._id))) {
          return results[i + offset];
        } else {
          offset++;
          return null;
        }
      })
    })
  }, { cacheKeyFn: key => String(key)})
}

module.exports =  function(userId) {
  return {
    Event: createLoaderFor(models.Event),
    Organisation: createLoaderFor(models.Organisation),
    Registration: createLoaderFor(models.Registration),
    RegistrationLink: new DataLoader(([ params ]) => {
      return models.Registration.findOne(params)
        .then(registration => Promise.resolve([ registration ]))
    }, { batch: false, cacheKeyFn: key => String(key["organisation._id"])+':'+String(key["user._id"]) }),
    Message: createLoaderFor(models.Message),
    Mailing: createLoaderFor(models.Mailing),
    User: createLoaderFor(models.User),
    UserEventParticipation: new DataLoader(eventIds => {
      const castedIds = eventIds
        .map(id => mongoose.Types.ObjectId(id))
      return models.Participation.aggregate([
        {$match: {"event._id": {$in: castedIds}, "user._id": mongoose.Types.ObjectId(userId)}},
        {$addFields: {"__order": {$indexOfArray: [castedIds, "$event._id" ]}}},
        {$sort: {"__order": 1}}
      ])
      .then(participations => {
        let offset = 0;
        return eventIds.map((id, i) => {
          if (participations[i + offset] && (String(id) === String(participations[i + offset].event._id))) {
            return participations[i + offset];
          } else {
            offset++;
            return null;
          }
        })
      })
    }, { cacheKeyFn: key => String(key)})
  }
}
