const removeUsers = require('../../tasks/removeUsers');

module.exports = function(parent, { id }, { currentUserId }) {
  if (!currentUserId) return null;

  return removeUsers([currentUserId], id)
  .then(organisation => {
    return organisation
  })
  .catch(e => console.log(e));
}
