const bodyParser = require('body-parser');
const { get } = require('axios');

const { jobs } = require('./config');
const { models } = require('./db');

const queue = require('./queue');

module.exports = (app) => {
  app.use('/auth', bodyParser.json());

  app.post('/auth/facebook', (req, res) => {
    const { userID, accessToken} = req.body;
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
              confirmed: true,
              userCreated: true,
            })
            .then((user, err) => {
              if(err) return res.sendStatus(500);
              return user.getToken().then(token => {
                return res.append('Authorization', token).sendStatus(201);
              });
            })
          }

          // one user found
          if (users.length === 1) {
            const [ user ] = users;

            if (user.facebookId === fbuser.id) {
              return user.getToken()
                .then(token => {
                  return res.append('Authorization', token).sendStatus(200);
                });
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

  });

  app.post('/auth/simple', (req, res) => {
    const { email, password } = req.body;
    models.User.findOne({ email }, '+password +salt').then(user => {
      if(user) {
        return user.comparePassword(password).then(auth => {
          if(!auth) return res.sendStatus(401);
          return user.getToken()
          .then(token => {
            return res.append('Authorization', token).sendStatus(200);
          })
        }).catch(() => {
          return res.sendStatus(401);
        })
      } else {
        const name = email.substr(0, email.indexOf('@'));
        return models.User.create({
          email: email,
          password: password,
          firstname: name ? name.substr(0, name.indexOf('.')) : 'Chuck',
          lastname: name ? name.substr(name.indexOf('.') + 1) : 'Noris',
          confirmed: false,
          userCreated: true,
        }).then(user => {
          queue.create(jobs.SEND_CONFIRM_EMAIL, { userId: user._id }).priority('high').save();
          return user.getToken()
          .then(token => {
            return res.append('Authorization', token).sendStatus(201);
          })
        })
      }
    }).catch(e => {
      return res.sendStatus(500);
    })
  });

  app.post('/auth/signin', (req, res) => {
    const {
      email,
      password,
      firstname,
      lastname,
      birthday,
    } = req.body;

    models.User.findOne({ email }, '+password +salt').then(user => {
      if(user) {
        if (!user.password) return res.status(409).json({ error: 'DUPLICATE_ACCOUNT' });
        return user.comparePassword(password).then(auth => {
          if(!auth) return res.sendStatus(401);
          return user.getToken()
          .then(token => {
            return res.append('Authorization', token).sendStatus(200);
          })
        }).catch(() => {
          return res.sendStatus(401);
        })
      } else {
        return models.User.create({
          email: email,
          password: password,
          firstname: firstname,
          lastname: lastname,
          birthday: birthday,
          confirmed: false,
          userCreated: true,
        })
        .then(user => user.getToken())
        .then(token => {
          return res.append('Authorization', token).sendStatus(201);
        });
      }
    }).catch(e => {
      return res.sendStatus(500);
    })
  });

  app.post('/auth/send_reset', (req, res) => {
    const {
      email
    } = req.body;
    models.User.findOne({ email }).then(user => {
      if (!user) return res.sendStatus(404);
      queue.create(jobs.SEND_RESET_PASSWORD, { userId: user._id }).priority('high').save();
      return res.sendStatus(200);
    })
  });

  app.post('/auth/send_confirm', (req, res) => {
    const {
      email
    } = req.body;
    models.User.findOne({ email }).then(user => {
      if (!user) return res.sendStatus(404);
      if (user.confirmed) return res.sendStatus(204);
      queue.create(jobs.SEND_CONFIRM_EMAIL, { userId: user._id }).priority('high').save();
      return res.sendStatus(200);
    })
  });

  app.post('/auth/password_reset', (req, res) => {
    const {
      password,
      token,
    } = req.body;
    models.User.findByPublicToken(token, { subject: 'rst_psw',}).then(user => {
      if(!user) return res.sendStatus(404);
      return user.setPassword(password)
      .then(() => user.getToken())
      .then(token => {
        return res.append('Authorization', token).sendStatus(200);
      });
    }).catch(e => {
      console.log(e);
      return res.sendStatus(400);
    })
  });

  app.post('/auth/confirm_email', (req, res) => {
    const { token } = req.body;
    models.User.confirmByPublicToken(token).then(user => {
      if (!user) return res.sendStatus(400);
      return res.sendStatus(200);
    }).catch(e => {
      console.log(e);
      return res.sendStatus(400);
    });
  })
}
