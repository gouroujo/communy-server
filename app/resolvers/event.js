const { omit, difference } = require('lodash');
const { mongoose, models } = require('../db');

const { answerYesToEvent, answerMaybeToEvent, answerNoToEvent } = require ('../tasks/answerToEvent');
const getFieldNames = require('../utils/getFields');

module.exports = {

  Event: {
    id(event) {
      return event.ref || event._id || event.id;
    },

    nusers(event) {
      return event.nusers;
    },

    nanswer(event) {
      return (event.yes ? event.yes.length : 0 )+ (event.no ? event.no.length : 0) + (event.mb ? event.mb.length : 0)
    },
    nno(event) {
      return event.no && event.no.length
    },
    nmb(event) {
      return event.mb && event.mb.length
    },

    answer(event, { userId }, { currentUser }) {
      if (event.answer) return event.answer;
      if (!currentUser) return null;

      if (event.yes && event.yes.find(u => String(u.ref) === String(userId || currentUser.id))) return 'yes';
      if (event.mb && event.mb.find(u => String(u.ref) === String(userId || currentUser.id))) return 'mb';
      if (event.no && event.no.find(u => String(u.ref) === String(userId || currentUser.id))) return 'no';

      return null;
    },

    users(event, { limit, yes, no, mb }, { currentUser }, info) {
      if (!currentUser) return new Error('Unauthorized');

      let users;
      if (yes) {
        // if (!currentUser.permissions.check(`organisation:${organisation._id}:addUser`)) return new Error('Forbidden');
        users = event.yes;
      } else if (no) {
        // if (!currentUser.permissions.check(`organisation:${organisation._id}:addUser`)) return new Error('Forbidden');
        users = event.no;
      } else if (mb){
        users = event.mb
      } else {
        users = [].concat(event.yes, event.no, event.mb)
      }
      return users;
      //
      // const fields = difference(getFieldNames(info), [
      //   'id', 'fullname', 'avatarUrl', 'answer', '__typename'
      // ])
      // if (fields.length === 0) {
      //   return event.yes.map(u => ({
      //     id: u.ref,
      //     fullname: u.fn,
      //     avatarUrl: u.av,
      //     answer: 'yes',
      //   }))
      // } else {
      //   return models.User.find({
      //     _id: { $in: event.yes.map(u => u.ref ) }
      //   })
      // }
    },
    organisation(event, args, ctx, info) {
      const fields = difference(getFieldNames(info), [
        'id', 'title', 'logoUrl', '__typename'
      ]);
      if (fields.length === 0) {
        return {
          id: event.organisation.ref,
          title: event.organisation.title,
          logoUrl: event.organisation.logoUrl,
        }
      } else {
        return models.Organisation.findById(event.organisation.ref)
      }
    },
  },

  Query: {

    events(parent, { before, after, limit, offset, organisationId }, { currentUser }) {
      if (!currentUser) return new Error('Unauthorized');
      if (organisationId && !currentUser.permissions.check(`organisation:${organisationId}:event_list`)) return new Error('Forbidden');

      const query = models.Event.find();
      if (after) query.gte('endTime', after)
      if (before) query.lte('startTime', before)

      if (organisationId) {
        query.where('organisation.ref').equals(organisationId)
      } else {
        query.in('organisation.ref', currentUser.permissions.permissions('organisation:?:events'))
      }

      return query.sort('endTime').limit(limit).skip(offset).lean().exec()
    },

    event(parent, { id }, { currentUser }) {
      if (!currentUser) return new Error('Unauthorized');

      return models.Event.findById(id).then(event => {
        if (!event) return new Error('Not found');
        if (!event.organisation || !event.organisation.ref) return new Error('Data Corrupted');
        if (!currentUser.permissions.check(`organisation:${event.organisation.ref}:event_view`))return new Error('Forbidden');

        return event;
      });
    },

  },
  Mutation: {

    createEvent(parent, { input, organisationId }, { currentUser }) {
      if (!currentUser) return new Error('Unauthorized');
      if (!currentUser.permissions.check(`organisation:${organisationId}:event_create`)) return new Error('Forbidden');

      return models.Organisation.findById(organisationId, 'title logo').then(organisation => {
        if (!organisation) return new Error('organisation not found');
        return models.Event.create(Object.assign(input, {
          organisation: {
            title: organisation.title,
            logo: organisation.logo,
            ref: organisation._id,
          }
        }))
      });
    },

    editEvent(parent, { id, input }, { currentUser }) {
      if (!currentUser) return new Error('Unauthorized');

      return models.Event.findById(id)
        .then(event => {
          if (!event) return new Error('Not found');
          if (!event.organisation || !event.organisation.ref) return new Error('Data Corrupted');
          if (!currentUser.permissions.check(`organisation:${event.organisation.ref}:event_edit`))return new Error('Forbidden');

          return Object.assign(event, input).save();
        })
    },

    deleteEvent(parent, { id }, { currentUser }) {
      if (!currentUser) return new Error('Unauthorized');

      return models.Event.findById(id)
        .then(event => {
          if (!event) return new Error('Not found');
          if (!event.organisation || !event.organisation.ref) return new Error('Data Corrupted');
          if (!currentUser.permissions.check(`organisation:${event.organisation.ref}:event_delete`))return new Error('Forbidden');

          return event.remove();
        });
    },

    addUserToEvent(parent, { id, input }, { currentUser }) {
      if (!currentUser) return new Error('Unauthorized');

      return models.Event.findById(id)
        .then(event => {
          if (!event) return new Error('Not found');
          if (!event.organisation || !event.organisation.ref) return new Error('Data Corrupted');
          if (input.userId && input.userId !== String(currentUser.id)) {
            if (!currentUser.permissions.check(`organisation:${event.organisation.ref}:event_add_user`))return new Error('Forbidden');
          } else {
            if (!currentUser.permissions.check(`organisation:${event.organisation.ref}:event_answer`))return new Error('Forbidden');
          }

          if (input.answer === 'yes') {
            return answerYesToEvent(
              input.userId || currentUser,
              event
            ).then(() => models.Event.findById(id))
          } else if (input.answer === 'no') {
            return answerNoToEvent(
              input.userId || currentUser,
              event
            ).then(() => models.Event.findById(id))
          } else if (input.answer === 'mb') {
            return answerMaybeToEvent(
              input.userId || currentUser,
              event
            ).then(() => models.Event.findById(id))
          }

          return event;
        });
    },

  }
}
