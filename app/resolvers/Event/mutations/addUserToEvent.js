module.exports = async (parent, { id, input }, { loaders, auth, currentUserId, models, logger }) => {
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

    await models.Participation.findOneAndUpdate({
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

    loaders.Event.clear(event._id).prime(event._id, updatedEvent.toObject());
    return updatedEvent;

  } catch (e) {
    logger.error(e);
    return null;
  }
}
