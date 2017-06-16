const { omit, difference } = require('lodash');
const { mongoose, models } = require('../db');
const getFieldNames = require('./utils/getFields');

module.exports = {
  Event: {
    id(event) {
      return event._id || event.id;
    },
    nusers(event) {
      return event.users.length;
    },
    status(event, { userId }) {
      if(event.status) return event.status;
      if(!userId) return null;
      const user = event.users.find(u => u._id === userId);
      return user ? user.status : null;
    },
    users(event, args, ctx, info) {
      const fields = difference(getFieldNames(info), [
        'id', 'fullname', 'avatarUrl', 'status', '__typename'
      ])
      if (fields.length === 0) {
        return event.users.map(u => ({
          id: u._id,
          fullname: u.fn,
          avatarUrl: u.av,
          status: u.st,
        }))
      } else {
        return models.User.find({
          _id: { $in: event.users.map(u => u._id ) }
        })
      }
    },
    organisation(event, args, ctx, info) {
      const fields = difference(getFieldNames(info), [
        'id', 'title', 'logoUrl', '__typename'
      ]);
      if (fields.length === 0) {
        return {
          id: event.organisation._id,
          title: event.organisation.title,
          logoUrl: event.organisation.logoUrl,
        }
      } else {
        return models.Organisation.findById(event.organisation._id)
      }
    },
  },
  Query: {
    events(parent, { before, after, limit, offset }, { currentUser, checkOrgPermission }) {
      if (!currentUser) return [];
      const query = models.Event.find();
      if (after) query.gte('endTime', after)
      if (before) query.lte('startTime', before)
      query.in('organisation._id',
        currentUser.organisations
        .filter(o => checkOrgPermission(o.status, 'events:list'))
        .map(o => o._id))
      return query.sort('endTime').limit(limit).skip(offset).lean().exec()
    },
    event(parent, { id }) {
      return models.Event.findById(id);
    }
  },
  Mutation: {
    createEvent(parent, { input }) {
      return Promise.all([
        Promise.resolve(new models.Event({
          _id: mongoose.Types.ObjectId(),
          title: input.title,
          description: input.description,
          startTime: input.startTime,
          endTime: input.endTime,
        })),
        models.Organisation.findById(input.organisationId, 'title logoUrl events')
      ]).then(([ event, organisation ]) => {
        return Promise.all([
          event.organisation.set({
            title: organisation.title,
            logoUrl: organisation.logoUrl,
            _id: organisation._id,
          }) && event.save(),
          organisation.events.push({
            title: event.title,
            startTime: event.startTime,
            endTime: event.endTime,
            _id: event._id,
          }) && organisation.save()

        ])
      }).then(([ event ]) => event )
    },
    updateEvent(parent, { id, input }) {
      return models.Event.findByIdAndUpdate(id, input, { new: true });
    },
    deleteEvent(parent, { id }) {
      return models.Event.findByIdAndRemove(id);
    },
    participateToEvent(parent, { id, input }) {
      return Promise.all([
        models.Event.findById(id, 'title startTime endTime users'),
        models.User.findById(input.userId, 'fullname avatarUrl events')
      ]).then(([ event, user ]) => {
        return Promise.all([
          organisation.users.push({
            fn: user.fullname,
            em: user.email,
            av: user.avatarUrl,
            st: input.status,
            _id: user._id
          }) && organisation.save(),
          user.organisations.push({
            title: organisation.title,
            logoUrl: organisation.logoUrl,
            status: input.status,
            _id: organisation._id
          }) &&  user.save()
        ])
      }).then(([ organisation ]) => organisation )
    }
  }
}
