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
      return ids.map(id => {
        if (results[offset] && (String(id) === String(results[offset]._id))) {
          offset = offset + 1;
          return results[offset - 1];
        } else {
          return null;
        }
      })
    })
  }, { cacheKeyFn: key => String(key)})
}

function createJoinLoaderFor(model, targetId, targetKey, modelKey) {
  return new DataLoader(networkIds => {
    const castedIds = networkIds
      .map(id => mongoose.Types.ObjectId(id))
    return model.aggregate([
      {$match: {[`${modelKey}._id`]: {$in: castedIds}, [`${targetKey}._id`]: mongoose.Types.ObjectId(targetId)}},
      {$addFields: {"__order": {$indexOfArray: [castedIds, `$${modelKey}._id` ]}}},
      {$sort: {"__order": 1}}
    ])
    .then(results => {
      let offset = 0;
      return networkIds.map(id => {
        if (results[offset] && (String(id) === String(results[offset][modelKey]._id))) {
          offset = offset + 1;
          return results[offset - 1];
        } else {
          return null;
        }
      })
    })
  }, { cacheKeyFn: key => String(key)})
}

function createJoinLoaderMapFor(model, targetKey, modelKey, mapInstance) {
  return (targetId) => {
    if (!mapInstance.has(targetId)) {
      mapInstance.set(targetId, createJoinLoaderFor(model, targetId, targetKey, modelKey))
    }
    return mapInstance.get(targetId);
  }
}

module.exports =  function(userId) {
  const Loaders = new Map();
  return {
    Event: createLoaderFor(models.Event),
    Organisation: createLoaderFor(models.Organisation),
    Network: createLoaderFor(models.Network),
    Membership: createLoaderFor(models.Membership),
    Registration: createLoaderFor(models.Registration),
    RegistrationLink: new DataLoader(([ params ]) => {
      return models.Registration.findOne(params)
        .then(registration => Promise.resolve([ registration ]))
    }, { batch: false, cacheKeyFn: key => String(key["organisation._id"])+':'+String(key["user._id"]) }),
    Message: createLoaderFor(models.Message),
    Mailing: createLoaderFor(models.Mailing),
    User: createLoaderFor(models.User),
    Participation: createLoaderFor(models.Participation),
    CurrentUserParticipation: createJoinLoaderFor(models.Participation, userId, 'user', 'event'),
    UserParticipationForEvent: createJoinLoaderMapFor(models.Participation, 'event', 'user', Loaders),
    EventParticipationForUser: createJoinLoaderMapFor(models.Participation, 'event', 'user', Loaders),
    NetworkMembershipForUser: createJoinLoaderMapFor(models.Membership, 'user', 'network', Loaders),
    OrganisationPartnershipForNetwork: createJoinLoaderMapFor(models.Partnership, 'network', 'organisation', Loaders),
    NetworkPartnershipForOrganisation: createJoinLoaderMapFor(models.Partnership, 'organisation', 'network', Loaders),
    OrganisationRegistrationForUser: createJoinLoaderMapFor(models.Registration, 'user', 'organisation', Loaders),
  }
}
