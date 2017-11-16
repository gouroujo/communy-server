module.exports = (organisation, params, { models }) => {
  return models.Mailing.find({ "organisation._id": organisation._id })
}
