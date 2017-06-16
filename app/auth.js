const bodyParser = require('body-parser');
const { get } = require('https');

const { REDIS_URI, jobs } = require('./config');
const { models } = require('./db');

const queue = require('kue').createQueue({ redis: REDIS_URI });

module.exports = (app) => {
  app.use('/auth', bodyParser.json());

  app.post('/auth/facebook', (req, res) => {
    const { userID, accessToken} = req.body;
    get(`https://graph.facebook.com/v2.9/${userID}?fields=id,first_name,last_name,picture,email&access_token=${accessToken}`, fbresponse => {
      if(fbresponse.statusCode === 200) {
        let data = '';
        fbresponse
          .on('data', (chunk) => {
            data += chunk
          })
          .on('end', () => {
            const fbuser = JSON.parse(data);
            models.User.find({
              $or: [
                { facebookId: fbuser.id },
                { email: fbuser.email }
              ]
            }).then(users => {
              if (!users.length) {
                models.User.create({
                  firstname: fbuser.first_name,
                  lastname: fbuser.last_name,
                  email: fbuser.email,
                  facebookId: fbuser.id,
                  avatarUrl: fbuser.picture ? fbuser.picture.data.url : null,
                  confirmed: true,
                }).then((user, err) => {
                  if(!err) {
                    res.append('Authorization', user.getToken()).sendStatus(201);
                  }
                  res.sendStatus(500);
                })
              } else if (users.length === 1) {
                const [ user ] = users;

                if (user.facebookId === fbuser.id) {
                  res.append('Authorization', user.getToken()).sendStatus(200);
                } else if(user.email === fbuser.email) {
                  res.status(409).json({ error: 'DUPLICATE_ACCOUNT' })
                } else {
                  res.sendStatus(500);
                }
              } else {
                res.sendStatus(500);
              }
            })
          });
      } else {
        res.sendStatus(503)
      }
    });
  });

  app.post('/auth/simple', (req, res) => {
    const { email, password } = req.body;
    models.User.findOne({ email }).then(user => {
      if(user) {
        return user.comparePassword(password).then(auth => {
          if (auth) res.append('Authorization', user.getToken()).sendStatus(200);
          else res.sendStatus(401);
        }).catch(() => {
          res.sendStatus(401);
        })
      } else {
        const name = email.substr(0, email.indexOf('@'));
        return models.User.create({
          email: email,
          password: password,
          firstname: name ? name.substr(0, name.indexOf('.')) : 'Chuck',
          lastname: name ? name.substr(name.indexOf('.') + 1) : 'Noris',
          confirmed: false,
        }).then(user => {
          queue.create(jobs.SEND_CONFIRM_EMAIL, { userId: user._id }).priority('high').save();
          res.append('Authorization', user.getToken()).sendStatus(201);
        })
      }
    }).catch(e => {
      res.sendStatus(500);
    })
  });

  app.post('/auth/sigin', (req, res) => {
    const {
      email,
      password,
      firstname,
      lastname,
      birthday,
    } = req.body;

    models.User.findOne({ email }).then(user => {
      if(user) {
        if (!user.password) return res.status(409).json({ error: 'DUPLICATE_ACCOUNT' });
        return user.comparePassword(password).then(auth => {
          if (auth) res.append('Authorization', user.getToken()).sendStatus(200);
          else res.sendStatus(401);
        }).catch(() => {
          res.sendStatus(401);
        })
      } else {
        return models.User.create({
          email: email,
          password: password,
          firstname: firstname,
          lastname: lastname,
          birthday: birthday,
          confirmed: false,
        }).then(user => {
          res.append('Authorization', user.getToken()).sendStatus(201);
        });
      }
    }).catch(e => {
      res.sendStatus(500);
    })
  });

  app.post('/auth/send_reset', (req, res) => {
    const {
      email
    } = req.body;
    models.User.findOne({ email }).then(user => {
      if (!user) return res.sendStatus(404);
      // TODO: send email with reset link
      const token = user.getPublicToken({
        expiresIn: '24h',
        subject: 'rst_psw',
      });

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
      // TODO: send email with confirm link
      const token = user.getPublicToken({
        subject: 'cfm_email',
      });

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
      return user.setPassword(password).then(() => {
        res.append('Authorization', user.getToken()).sendStatus(200);
      });
    }).catch(e => {
      console.log(e);
      res.sendStatus(400);
    })
  });

  app.post('/auth/confirm_email', (req, res) => {
    const { token } = req.body;
    models.User.confirmByPublicToken(token).then(user => {
      if (!user) return res.sendStatus(400);
      res.append('Authorization', user.getToken()).sendStatus(200);
    }).catch(e => {
      console.log(e);
      res.sendStatus(400);
    });
  })
}
