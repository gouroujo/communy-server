const { models } = require('db');
const logger = require('logger')
const { roles } = require('dict')
const sanitizeHtml = require('sanitize-html');

module.exports = async function (parent, { input }, { currentUserId, loaders }) {
  if (!currentUserId) return null;

  try {
    const currentUser = await loaders.User.load(currentUserId);
    const company = await models.Company.create(Object.assign({}, input, {
      nusers: 1,
      description: sanitizeHtml(input.description)
    }));

    const employment = await models.Employment.create({
      user: {
        _id: currentUser._id,
        fullname: (currentUser.firstname || currentUser.lastname) ? `${currentUser.firstname + ' ' || ''}${currentUser.lastname || ''}` : currentUser.email
      },
      company: company.toObject(),
      ack: true,
      role: roles.ADMIN,
    });

    await Promise.all([
      (currentUser.employment && currentUser.employment._id) ? (
        models.Employment.update({ _id: currentUser.employment._id}, { deleted: true })
      ) : Promise.resolve(),
      models.User.update({ _id: currentUser._id }, {
        employment: employment.toObject(),
      }),
    ]);

    loaders.Company.prime(company._id, company.toObject())
    return company;

  } catch(e) {
    logger.warn(e);
    return null;
  }
}
