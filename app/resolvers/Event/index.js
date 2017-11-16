module.exports = {
  Event: require('./fields'),
  Query: {
    events(parent, { before, after, limit, offset, organisationId }, { auth, models }) {
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

    async event(parent, { id }, { auth, loaders, logger }) {
      if (!auth) return null;
      try {
        const event = await loaders.Event.load(id);
        if (!event) return null;
        if (!event.organisation || !event.organisation._id) throw new Error('Data Corrupted');
        if (!auth.check(`organisation:${event.organisation._id}:event_view`)) return null;

        return event;
      } catch (e) {
        logger.error(e);
        return null;
      }
    },
  },
  Mutation: {
    createEvent: require('./mutations/createEvent'),
    deleteEvent: require('./mutations/deleteEvent'),
    editEvent: require('./mutations/editEvent'),
    addUserToEvent: require('./mutations/addUserToEvent'),
  }
}
