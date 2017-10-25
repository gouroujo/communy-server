const removeUsers = require('../../tasks/removeUsers');

module.exports = function(parent, { id }, { currentUser }) {
  if (!currentUser) return new Error('Unauthorized');

  return removeUsers([currentUser._id], id)
  .then(organisation => {
    return organisation
  })
  .catch(e => console.log(e));
}
