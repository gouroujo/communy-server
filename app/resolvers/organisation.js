const { omit, difference } = require('lodash');
const { models, mongoose } = require('../db');
const getFieldNames = require('./utils/getFields');
const filterEvents = require ('./utils/filterEvents');
const signCloudinary = require('./utils/signCloudinary');
const { orgStatus, CLOUDINARY_KEY } = require('../config');

module.exports = {
  OrganisationUser: {
    ref(user) {
      return user._id
    },
    status(user) {
      return user.st;
    },
    fullname(user) {
      return user.fn
    },
    avatarUrl(user) {
      return user.av
    },
    email(user) {
      return user.em;
    },
  },
  Organisation: {
    id(organisation) {
      return organisation._id || organisation.id;
    },
    nusers(organisation) {
      if (!organisation.users) return 0;
      return organisation.users.length;
    },
    status(organisation, args, { currentUser }) {
      if(!currentUser) return null;
      if (organisation.status) return organisation.status;
      const org = currentUser.organisations.find(o => String(o._id) == organisation._id);
      return org ? org.status : null;
    },
    joinedAt(organisation) {
      return organisation.t || null;
    },
    users(organisation, args, ctx, info) {
      return organisation.users;
      // const fields = difference(getFieldNames(info), [
      //   'id', 'fullname', 'email', 'avatarUrl', 'status'
      // ])
      // if (fields.length === 0) {
      //   return organisation.users.map(u => ({
      //     id: u._id,
      //     fullname: u.fn,
      //     avatarUrl: u.av,
      //     email: u.em,
      //     status: u.st,
      //   }))
      // } else {
      //   return models.User.find({
      //     _id: { $in: organisation.users.map(u => u._id ) }
      //   })
      // }
    },
    nevents(organisation) {
      if (!organisation.events) return 0;
      return organisation.events.length;
    },
    events(organisation, args, ctx, info) {
      const fields = difference(getFieldNames(info), [
        'id', 'title', 'startTime', 'endTime'
      ])
      if (fields.length === 0) {
        return filterEvents(organisation.events, args).map(e => ({
          id: e._id,
          title: e.title,
          startTime: e.startTime,
          endTime: e.endTime,
        }))
      } else {
        const query = models.Event.find({
          _id: { $in: organisation.events.map(e => e._id ) }
        });
        if (args.after) query.gte('endTime', args.after)
        if (args.before) query.lte('startTime', args.before)
        return query.limit(args.limit).skip(args.offset).lean().exec()
      }
    },
    coverUploadOpts(organisation) {
      if(!organisation || !organisation._id) return null;

      const options = {
        api_key: CLOUDINARY_KEY,
        timestamp: Date.now(),
        public_id: `organisations/${organisation._id}/cover`,
        overwrite: true,
        invalidate: true,
        return_delete_token: true,
        discard_original_filename: true,
        tags: `cover,${organisation._id},organisation`,
        format: 'jpg',
        resource_type: 'image',
      };

      return JSON.stringify(Object.assign({}, options, {
        signature : signCloudinary(options)
      }));
    }
  },
  Query: {
    createOrganisation() {
      return {
        _id: mongoose.Types.ObjectId()
      };
    },
    organisations(_, { status, limit, offset }) {
      return models.Organisation.find({ status })
        .skip(offset)
        .limit(limit)
        .lean();
    },
    organisation(_, { id }) {
      return models.Organisation.findById(id).lean()
        .then(res => {
          if (res) return res;
          return {
            _id: mongoose.Types.ObjectId()
          };
        });
    },
  },
  Mutation: {
    createOrganisation(_, { input }) {
      const organisation = new models.Organisation(input)
      return organisation.save();
    },
    mutateOrganisation(_, { id, input }) {
      console.log(id)
      return models.Organisation.findByIdAndUpdate(
        id,
        input,
        { new: true, upsert: true }
      )
    },
    deleteOrganisation(_, { id }) {
      return models.Organisation.findByIdAndRemove(id)
    },
    joinOrganisation(parent, { id }, { currentUser }) {
      return models.Organisation.findById(id)
        .then((organisation) => {
          return Promise.all([
            organisation.users.push({
              fn: currentUser.fullname,
              em: currentUser.email,
              av: currentUser.avatarUrl,
              st: orgStatus.WAITING_CONFIRM,
              _id: currentUser._id,
              t: Date.now(),
            }) && organisation.save(),
            currentUser.organisations.push({
              title: organisation.title,
              logoUrl: organisation.logoUrl,
              status: orgStatus.WAITING_CONFIRM,
              _id: organisation._id,
              t: Date.now(),
            }) &&  currentUser.save()
          ])
        })
        .then(([ organisation ]) => organisation )
    },
    addUserToOrganisation(_, { id, input }) {
      return Promise.all([
        models.Organisation.findById(id),
        models.User.findOneAndUpdate({ email: input.email }, {}, { new: true, upsert: true })
      ]).then(([ organisation, user ]) => {
        return Promise.all([
          organisation.users.push({
            fn: user.fullname,
            em: user.email,
            av: user.avatarUrl,
            st: input.status,
            _id: user._id,
            t: Date.now(),
          }) && organisation.save(),
          user.organisations.push({
            title: organisation.title,
            logoUrl: organisation.logoUrl,
            status: input.status,
            _id: organisation._id,
            t: Date.now(),
          }) &&  user.save()
        ])
      }).then(([ organisation ]) => organisation )
    }
  },
}
