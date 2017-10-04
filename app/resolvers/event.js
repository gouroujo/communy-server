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

    answer(event, { userId }, { currentUser }) {
      if (event.answer) return event.answer;
      if (!currentUser) return null;

      if (event.yes && event.yes.find(u => String(u._id) === String(userId || currentUser.id))) return 'yes';
      if (event.mb && event.mb.find(u => String(u._id) === String(userId || currentUser.id))) return 'mb';
      if (event.no && event.no.find(u => String(u._id) === String(userId || currentUser.id))) return 'no';

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
      //     id: u._id,
      //     fullname: u.fn,
      //     avatarUrl: u.av,
      //     answer: 'yes',
      //   }))
      // } else {
      //   return models.User.find({
      //     _id: { $in: event.yes.map(u => u._id ) }
      //   })
      // }
    },
    organisation(event, args, ctx, info) {
      const fields = difference(getFieldNames(info), [
        'id', 'title', 'logo', '__typename'
      ]);
      if (fields.length === 0) {
        return {
          id: event.organisation._id,
          title: event.organisation.title,
          logo: event.organisation.logo,
        }
      } else {
        return models.Organisation.findById(event.organisation._id)
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
        query.where('organisation._id').equals(organisationId)
      } else {
        query.in('organisation._id', currentUser.permissions.permissions('organisation:?:event_list'))
      }

      return query.sort('endTime').limit(limit).skip(offset).lean().exec()
    },

    event(parent, { id }, { currentUser, loaders }) {
      if (!currentUser) return new Error('Unauthorized');

      return loaders.Event.load(id).then(event => {
        if (!event) return new Error('Not found');
        if (!event.organisation || !event.organisation._id) return new Error('Data Corrupted');
        if (!currentUser.permissions.check(`organisation:${event.organisation._id}:event_view`))return new Error('Forbidden');

        return event;
      });
    },

  },
  Mutation: {

    async createEvent(parent, { input, organisationId }, { currentUser, language }) {
      if (!currentUser) return new Error('Unauthorized');
      if (!currentUser.permissions.check(`organisation:${organisationId}:event_create`)) return new Error('Forbidden');

      const [ organisation, address ] = await Promise.all([
        models.Organisation.findById(organisationId, 'title'),
        (input.address ? geocoder(input.address, language) : Promise.resolve())
      ])

      if (!organisation) return new Error('organisation not found');

      const [ event ] = await Promise.all([
        models.Event.create(Object.assign(input, { organisation, address: Object.assign({}, address, input.address) })),
        organisation.update({ $inc: { nevents: 1 }})
      ])

      return event
    },

    async editEvent(parent, { id, input }, { currentUser, language }) {
      if (!currentUser) return new Error('Unauthorized');
      const event = models.Event.findById(id)

      if (!event) return new Error('Not found');
      if (!event.organisation || !event.organisation._id) return new Error('Data Corrupted');
      if (!currentUser.permissions.check(`organisation:${event.organisation._id}:event_edit`))return new Error('Forbidden');
      if (input.address) {
        const address = geocoder(input.address, language)
        return Object.assign(event, input, { address: Object.assign({}, address, input.address) }).save();
      }
      return Object.assign(event, input).save();

    },

    deleteEvent(parent, { id }, { currentUser }) {
      if (!currentUser) return new Error('Unauthorized');

      return models.Event.findById(id)
        .then(event => {
          if (!event) return new Error('Not found');
          if (!event.organisation || !event.organisation._id) return new Error('Data Corrupted');
          if (!currentUser.permissions.check(`organisation:${event.organisation._id}:event_delete`))return new Error('Forbidden');

          return event.remove();
        });
    },

    addUserToEvent(parent, { id, input }, { currentUser }) {
      if (!currentUser) return new Error('Unauthorized');

      return models.Event.findById(id)
        .then(event => {
          let userPromise;
          if (!event) return new Error('Not found');
          if (!event.organisation || !event.organisation._id) return new Error('Data Corrupted');
          if (input.userId && input.userId !== String(currentUser.id)) {
            if (!currentUser.permissions.check(`organisation:${event.organisation._id}:event_add_user`))return new Error('Forbidden');
            userPromise = models.User.findById(input.userId);
          } else {
            if (!currentUser.permissions.check(`organisation:${event.organisation._id}:event_answer`))return new Error('Forbidden');
            userPromise = Promise.resolve(currentUser);
          }

          if (input.answer === 'yes') {
            return userPromise
            .then(user => Promise.all([
              models.Event.bulkWrite([
                {
                  updateOne: {
                    filter: {
                      _id: id,
                      "yes._id": { $ne: user._id },
                      "no._id": { $eq: user._id },
                    },
                    update: {
                      "$pull": { no: { _id: user._id } },
                      "$push": { yes: user },
                      "$inc": { nusers: 1 },
                    }
                  },
                },
                {
                  updateOne: {
                    filter: {
                      _id: id,
                      "yes._id": { $ne: user._id },
                      "mb._id": { $eq: user._id },
                    },
                    update: {
                      "$pull": { mb: { _id: user._id } },
                      "$push": { yes: user },
                      "$inc": { nusers: 1 },
                    }
                  },
                },
                {
                  updateOne: {
                    filter: {
                      _id: id,
                      "yes._id": { $ne: user._id },
                      "no._id": { $ne: user._id },
                      "mb._id": { $ne: user._id },
                    },
                    update: {
                      "$push": { yes: user },
                      "$inc": { nusers: 1 },
                    }
                  },
                },
              ])
            ]))
            .then(() => {
              return models.Event.findById(id);
            })
          } else if (input.answer === 'no') {
            return userPromise
            .then(user => Promise.all([
              models.Event.bulkWrite([
                {
                  updateOne: {
                    filter: {
                      _id: id,
                      "yes._id": { $ne: user._id },
                      "no._id": { $ne: user._id },
                      "mb._id": { $ne: user._id },
                    },
                    update: {
                      "$push": { no: user },
                    }
                  },
                },
                {
                  updateOne: {
                    filter: {
                      _id: id,
                      "yes._id": { $eq: user._id },
                      "no._id": { $ne: user._id },
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
                      _id: id,
                      "mb._id": { $eq: user._id },
                      "no._id": { $ne: user._id },
                    },
                    update: {
                      "$pull": { mb: { _id: user._id } },
                      "$push": { no: user },
                    }
                  },
                },
              ])
            ]))
            .then(() => models.Event.findById(id))
          } else if (input.answer === 'mb') {
            return userPromise
            .then(user => Promise.all([
              models.Event.bulkWrite([
                {
                  updateOne: {
                    filter: {
                      _id: id,
                      "yes._id": { $ne: user._id },
                      "no._id": { $ne: user._id },
                      "mb._id": { $ne: user._id },
                    },
                    update: {
                      "$push": { mb: user },
                    }
                  },
                },
                {
                  updateOne: {
                    filter: {
                      _id: id,
                      "yes._id": { $eq: user._id },
                      "mb._id": { $ne: user._id },
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
                      _id: id,
                      "no._id": { $eq: user._id },
                      "mb._id": { $ne: user._id },
                    },
                    update: {
                      "$pull": { no: { _id: user._id } },
                      "$push": { mb: user },
                    }
                  },
                },
              ])
            ]))
            .then(() => models.Event.findById(id))
          }

          return event;
        });
    },

  }
}
