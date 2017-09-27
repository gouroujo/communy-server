const removeUsers = require('../../tasks/removeUsers');

module.exports = function (parent, { id, input }, { currentUser }) {
  if (!currentUser) return new Error('Unauthorized');
  if (!currentUser.permissions.check(`organisation:${id}:removeUser`)) return new Error('Forbidden');

  return removeUsers([input.userId], id)
  .then(organisation => {
    return organisation
  })
    .catch(e => console.log(e));
}
