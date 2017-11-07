const removeUsers = require('../../tasks/removeUsers');

module.exports = function (parent, { id, input }, { auth }) {
  if (!auth) return null;
  if (!auth.check(`organisation:${id}:removeUser`)) return new Error('Forbidden');

  return removeUsers([input.userId], id)
  .then(organisation => {
    return organisation
  })
    .catch(e => console.log(e));
}
