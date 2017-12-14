const models = require('db').models
const config = require('config')
const logger = require('logger')
const { verify } = require('jsonwebtoken')
const verifyAsync = require('util').promisify(verify)

module.exports = async function(req, res) {
  const { token } = req.body;
  if (!token) return res.sendStatus(400)

  try {
    const payload = await verifyAsync(token, config.get('SECRET'), { subject: 'join'})

    const [
      user,
      organisation,
      registration
    ] = await Promise.all([
      models.User.findById(payload.id),
      models.Organisation.findById(payload.organisationId),
      models.Registration.findOne({ "organisation._id": payload.organisationId, "user._id": payload.id, "confirm": true, })
    ])

    if (!registration || !user || !organisation) return res.sendStatus(404)

    if (!registration.ack) {
      await Promise.all([
        models.Organisation.updateOne(
          {
            _id: payload.organisationId
          },
          {
            "$inc": {
              nusers: 1,
              nwt_ack: -1,
            }
          }, { new: true }
        ),
        models.Registration.updateOne(
          {
            "user._id": payload.id,
            "organisation._id": payload.organisationId,
          },
          {
            ack: true
          }
        ),
        models.User.updateOne(
          {
            "_id": payload.id,
            "registrations": {
              "$elemMatch": {
                "organisation._id": payload.organisationId,
                "ack": false
              }
            }
          },
          {
            "$set": {
              "registrations.$.ack": true,
              "userCreated": true,
            },
            $inc: { norganisations: 1 },
          }
        )
      ]);
    }

    return res.json({
      token: await user.getToken()
    })

  } catch (e) {
    logger.error(e)
    res.sendStatus(401)
  }
}
