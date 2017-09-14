const models = require('../db').models;

module.exports =function (req, res) {
  const {
    email,
    password,
    firstname,
    lastname,
    birthday,
  } = req.body;

  models.User.findOne({ email }, '+password +salt').then(user => {

    if(user) {
      if (!user.password) return res.status(409).send('DUPLICATE_ACCOUNT');
      return user.comparePassword(password)
      .then(auth => {
        if(!auth) return res.status(401).send('BAD CREDENTIALS');
        return user.getToken()
      })
      .then(token => {
        if (!token) return;
        return res.append('Authorization', token).sendStatus(200);
      })
      .catch(() => {
        return res.sendStatus(401);
      })
    }

    return models.User.create({
      email: email,
      password: password,
      firstname: firstname,
      lastname: lastname,
      birthday: birthday,
      confirm: false,
      userCreated: true,
    })
    .then(user => {
      return user.sendConfirmation()
      .then(() => user.getToken())
    })
    .then(token => {
      return res.append('Authorization', token).sendStatus(201);
    });

  }).catch(e => {
    return res.sendStatus(500);
  })
}
