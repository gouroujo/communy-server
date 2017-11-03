module.exports = async function(filename, db) {
  const migration = await db.models.Migration.findOne({ filename });
  if (migration) {
    console.log('already migrate')
    return null;
  }

  try {
    const users = await db.models.User.find({
      "organisations": { $exists: true }
    }, { organisations: 1 });

    await Promise.all(users.map(user => {
      const organisations = user.get("organisations")
      if (organisations) {
        user.set({
          registrations: organisations.map(organisation => ({
            ack: organisation.ack,
            confirm: organisation.confirm,
            role: organisation.role,
            organisation: {
              title: organisation.title,
              _id: organisation._id,
            }
          })),
        });
      }

      user.set('organisations', undefined, { strict: false });
      return user.save()
    }))
    return db.models.Migration.create({ filename })
  } catch (e) {
    console.log(e)
  }

  return;

}
