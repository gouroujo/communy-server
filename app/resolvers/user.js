const { omit, difference } = require('lodash');
const { models } = require('../db');
const getFieldNames = require('./utils/getFields');

module.exports = {
  User: {
    id(user) {
      return user._id || user.id;
    },
    norganisations(user) {
      return user.organisations.length;
    },
    organisations(user, args, ctx, info) {
      const fields = difference(getFieldNames(info), [
        'id', 'title', 'logoUrl', 'status', 'joinedAt', '__typename'
      ])
      if (fields.length === 0) {
        return user.organisations.map(o => ({
          id: o._id,
          title: o.title,
          logoUrl: o.logoUrl,
          status: o.status,
          t: o.t,
        }))
      } else {
        return models.Organisation.find({
          _id: { $in: user.organisations.map(org => org._id ) }
        }).then(organisations => (
          organisations.map(organisation => {
            const uo = user.organisations.find(o => {
              return o._id == organisation.id
            });
            return uo ? Object.assign(organisation, { status: uo.status, t: uo.t }) : organisation;
          })
        ))
      }
    },
    events(user, args, ctx, info) {
      // TODO: check before/after args
      const fields = difference(getFieldNames(info), [
        'id', 'title', 'startTime', 'endTime'
      ])
      if (fields.length === 0) {
        return user.events.map(e => ({
          id: e._id,
          title: e.title,
          startTime: e.startTime,
          endTime: e.endTime,
        }))
      } else {
        return models.Event.find({
          _id: { $in: user.events.map(e => e._id ) }
        }).then(events => (
          events.map(event => {
            const ue = user.events.find(e => {
              return e._id == event.id
            });
            return ue ? Object.assign(event, { status: ue.status, t: ue.t }) : event;
          })
        ))
      }
    }
  },

  Query: {
    user(parent, { id }) {
      return models.User.findById(id);
    },
    me(parent, args, { currentUser }) {
      return currentUser;
    }
  },

  Mutation: {
    createUser(parent, { input }) {
      return models.User.create(input)
    },
    updateUser(parent, { input }) {
      return models.User.findByIdAndUpdate(
        input.id,
        omit(input, 'id'),
        { new: true }
      )
    },
  }
}
