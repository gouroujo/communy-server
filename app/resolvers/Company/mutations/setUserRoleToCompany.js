
module.exports = async (parent, { id, input }, { loaders, auth, models, logger }) => {
  if (!auth) return null;
  if (!auth.check(`organisation:${id}:set_${input.role}_role`)) return new Error('Forbidden');

  try {
    await Promise.all([
      models.User.update(
        {
          _id: input.userId,
          registrations: {
            $elemMatch: { "organisation._id": id }
          }
        }, {
          "organisations.$.role": input.role,
        }
      ),
      models.Registration.update(
        {
          "user._id": input.userId,
          "organisation._id": id,
        }, {
          "role": input.role,
        }
      )
    ]);

    return loaders.Organisation.load(id);
    
  } catch (e) {
    logger.error(e);
    return null;
  }
}
