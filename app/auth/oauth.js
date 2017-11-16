const { get } = require('axios');
const models = require('../db').models;
const config = require('../config');

// const joinOrganisation = require('../resolvers/mutations/joinOrganisation');

module.exports = function (req, res) {
  const {
    userID,
    accessToken,
    // provider
  } = req.body;
  get(`https://graph.facebook.com/v2.9/${userID}?fields=id,first_name,last_name,picture,email&access_token=${accessToken}`)
    .then(response => {
      const fbuser = response.data;

      return models.User.find({
        $or: [
          { facebookId: fbuser.id },
          { email: fbuser.email }
        ]
      })
      .then(users => {

        // no user found
        if (!users.length) {
          return models.User.create({
            firstname: fbuser.first_name,
            lastname: fbuser.last_name,
            email: fbuser.email,
            facebookId: fbuser.id,
            avatar: fbuser.picture ? fbuser.picture.data.url : null,
            confirm: true,
            userCreated: true,
          })
          // .then(user => {
          //   return (config.get('DEFAULT_ORG_ID') ? (
          //     joinOrganisation(null, { id: config.get('DEFAULT_ORG_ID')}, { currentUser: user })
          //   ) : Promise.resolve())
          //   .catch(e => console.log(e))
          //   .then(() => user)
          // })
          .then(user => user.getToken())
          .then(token => {
            return res.append('Authorization', token).sendStatus(201);
          })
        }

        // one user found
        if (users.length === 1) {
          const [ user ] = users;

          if (
            (user.facebookId === fbuser.id) ||
            (!user.facebookId && !user.password && user.email === fbuser.email)
          ) {
            return (user.facebookId ? Promise.resolve() : user.update({ facebookId: fbuser.id}))
              .then(() => user.getToken())
              .then(token => {
                return res.append('Authorization', token).sendStatus(200);
              })
          }

          if(user.email === fbuser.email) {
            return res.status(409).send('DUPLICATE ACCOUNT');
          }

          // more than one user found => error
          return res.status(500).send('CORRUPTED DATA')
        }
      })
    })

    .catch(error => {
      console.log(error);
      res.sendStatus(503);
    });

}
