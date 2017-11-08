const { omit, difference } = require('lodash');
const moment = require('moment');
const { mongoose, models } = require('../db');
const getFieldNames = require('../utils/getFields');
const geocoder = require('../utils/geocoder');

module.exports = {

  Event: {
    id(event) {
      return event._id || event._id || event.id;
    },

    nusers(event, params, { getField }) {
      return getField('nanswers', event, 'Event');
    },
    nanswer(event, params, { getField }) {
      return getField('nanswers', event, 'Event');
    },
    nno(event, params, { getField }) {
      return getField('nno', event, 'Event');
    },
    nmb(event, params, { getField }) {
      return getField('nmb', event, 'Event');
    },
    nyes(event, params, { getField }) {
      return getField('nyes', event, 'Event');
    },

    duration(event) {
      return moment.duration(event.endTime - event.startTime).toISOString()
    },

    days(event) {
      let start = moment(event.startTime).hours(0).minutes(0).seconds(0).milliseconds(0);
      const end = moment(event.endTime);
      const dateArray = [];
      while (start < end) {
        dateArray.push(start.format('YYYYMMDD'));
        start = start.clone().add(1, 'day');
      }
      return dateArray;
    },

    async participation(event, { userId }, { loaders, auth, currentUserId }) {
      if (!currentUserId) return niull;
      if (!userId) {
        return loaders.UserEventParticipation.load(event._id)
      }

      try {
        const participation = await loaders.UserParticipationForEvent(event._id).load(userId);
        if (!participation) return null;
        if ((userId !== currentUserId) && !auth.check(`organisation:${participation.organisation._id}:event_add_user`)) {
          return null;
        }

        return participation;
      } catch(e) {
        console.log(e);
        return null;
      }
    },

    participations(event, { offset, limit, yes, no, mb }, { auth }) {
      // TODO: store the last 50/100 participations in event document
      const query = models.Participation.find({ "event._id": event._id });

      if (yes) query.where("answer", 'yes');
      if (no) query.where("answer", 'no');
      if (mb) query.where("answer", 'mb');

      return query
      .sort('user.fullname')
      .limit(limit)
      .skip(offset)
      .lean()
      .exec();
    },

    organisation(event, args, { getField }) {
      return getField('organisation', event, 'Event');
    },
  },

  Query: {

    events(parent, { before, after, limit, offset, organisationId }, { auth }) {
      if (!auth) return null;
      if (organisationId && !auth.check(`organisation:${organisationId}:event_list`)) {
        return null;
      }

      const query = models.Event.find();
      if (after) query.gte('endTime', after)
      if (before) query.lte('startTime', before)

      if (organisationId) {
        query.where('organisation._id').equals(organisationId)
      } else {
        query.in('organisation._id', auth.permissions('organisation:?:event_list'))
      }

      return query.sort('endTime').limit(limit).skip(offset).lean().exec()
    },

    async event(parent, { id }, { auth, loaders }) {
      if (!auth) return null;
      try {
        const event = await loaders.Event.load(id);
        if (!event) return null;
        if (!event.organisation || !event.organisation._id) throw new Error('Data Corrupted');
        if (!auth.check(`organisation:${event.organisation._id}:event_view`)) return null;

        return event;
      } catch (e) {
        console.log(e);
        return null;
      }
    },
  },

  Mutation: {

    async createEvent(parent, { input, organisationId }, { auth, language }) {
      if (!auth) return null;
      if (!auth.check(`organisation:${organisationId}:event_create`)) return null;

      const organisation = await models.Organisation.findById(organisationId, 'title')
      if (!organisation) return new Error('organisation not found');

      let newEvent = Object.assign(input, { organisation })
      if (input.address) {
        try {
          const address = await geocoder(input.address, language)
          newEvent.address = Object.assign({}, address, input.address)
        } catch (e) {
          console.log(e)
        }
      }

      const [ event ] = await Promise.all([
        models.Event.create(newEvent),
        organisation.update({ $inc: { nevents: 1 }})
      ])

      return event
    },

    async editEvent(parent, { id, input }, { auth, language }) {
      if (!auth) return null;
      const event = await models.Event.findById(id)

      if (!event) return null;
      if (!event.organisation || !event.organisation._id) return null;
      if (!auth.check(`organisation:${event.organisation._id}:event_edit`))return null;

      if (input.address) {
        try {
          const address = await geocoder(input.address, language)
          return Object.assign(event, input, { address: Object.assign({}, address, input.address) }).save();
        } catch (e) {
          return Object.assign(event, input).save();
        }
      }

      return Object.assign(event, input).save();

    },

    async deleteEvent(parent, { id }, { auth }) {
      if (!auth) return null;
      try {
        const event = await models.Event.findById(id);
        if (!event) return null;
        if (!event.organisation || !event.organisation._id) return null;
        if (!auth.check(`organisation:${event.organisation._id}:event_delete`))return null;
        await event.remove();
        await models.Participation.remove({ "event._id": event._id })

        return null;

      } catch (e) {
        console.log(e);
        return null;
      }
    },

    async addUserToEvent(parent, { id, input }, { permissions, loaders, auth, currentUserId }) {
      if (!auth) return null;

      try {
        const event = await loaders.Event.load(id);
        if (!event.organisation || !event.organisation._id) throw new Error('Data Corrupted');
        if (
          input.userId &&
          input.userId !== currentUserId &&
          !auth.check(`organisation:${event.organisation._id}:event_add_user`)) {
          return null;
        }
        if (!auth.check(`organisation:${event.organisation._id}:event_answer`)) {
          return null
        }

        const user = await loaders.User.load(input.userId || currentUserId);
        const participation = await models.Participation.findOne({
          "event._id": id,
          "user._id": user._id,
        });

        const updatedParticipation = await models.Participation.findOneAndUpdate({
          "event._id": id,
          "user._id": user._id
        }, {
          "$set": {
            answer: input.answer,
          },
          "$setOnInsert": {
            event: event,
            organisation: event.organisation,
            user: {
              _id: user._id,
              fullname: (user.firstname || user.lastname) ? `${user.firstname || ''} ${user.lastname || ''}` : user.email
            }
          }
        }, {
          upsert: true,
          new: true,
        });

        const updatedEvent = (participation ?
          await models.Event.findByIdAndUpdate(event._id, {
            $inc: {
              nyes: (input.answer === 'yes' ? 1 : 0) - (participation.answer === 'yes' ? 1 : 0),
              nno: (input.answer === 'no' ? 1 : 0) - (participation.answer === 'no' ? 1 : 0),
              nmb: (input.answer === 'mb' ? 1 : 0) - (participation.answer === 'mb' ? 1 : 0),
            }
          }, { new: true }) :
          await models.Event.findByIdAndUpdate(event._id, {
            $inc: {
              nyes: (input.answer === 'yes' ? 1 : 0),
              nno: (input.answer === 'no' ? 1 : 0),
              nmb: (input.answer === 'mb' ? 1 : 0),
              nanswers: 1
            }
          }, { new: true })
        );

        if (participation && (!input.userId || input.userId === currentUserId)) {
          loaders.UserEventParticipation.clear(event._id).prime(event._id, updatedParticipation.toObject())
        } else if (!input.userId || input.userId === currentUserId) {
          loaders.UserEventParticipation.prime(event._id, updatedParticipation.toObject())
        }

        loaders.Event.clear(event._id).prime(event._id, updatedEvent.toObject());
        return updatedEvent;

      } catch (e) {
        console.log(e);
        return null;
      }
    }
  }
}
