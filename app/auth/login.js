const models = require('../db').models;

module.exports = function (req, res) {
  const { email, password } = req.body;
  return models.User.findOne({ email }, '+password +salt').then(user => {
    if(user) {
      return user.comparePassword(password).then(auth => {
        if(!auth) return res.status(401).send('BAD CREDENTIALS');

        return user.getToken()
          .then(token => {
            return res.append('Authorization', token).sendStatus(200);
          })

      })
      .catch(e => {
        console.log(e)
        return res.sendStatus(401);
      })
    }

    return res.status(404).send('USER NOT FOUND')

  }).catch(e => {
    console.log(e)
    return res.sendStatus(500);
  })
}
