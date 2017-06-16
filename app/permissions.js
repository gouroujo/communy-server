const { orgStatus } = require('./config');

function checkPerm(perms, check) {
  const s = check.split(':')
  return perms
    .map(p => p.split(':'))
    .filter(p => p[0] !== s[0])
    .reduce((acc, p) => {
      return acc || p[1] === '*' || p[1] === s[1]
    }, false)

}
module.exports = {
  checkOrgPermission: function (status, permission) {
    switch (status) {
      case orgStatus.WAITING_ACK :
        return checkPerm([
          'organisation:read',
        ], permission);
      case orgStatus.WAITING_CONFIRM :
        return checkPerm([
          'organisation:read',
        ], permission);
      case orgStatus.MEMBER :
        return checkPerm([
          'organisation:read',
          'event:list',
          'event:read',
          'user:list'
        ], permission);
      case orgStatus.MOD :
        return checkPerm([
          'organisation:read',
          'event:*',
          'user:list',
          'user:read',
          'user:invite',
          'user:confirm'
        ], permission);
      case orgStatus.ADMIN :
        return checkPerm([
          'organisation:*',
          'event:*',
          'user:*'
        ], permission);
      default:
        return false
    }
    return true;
  }
}
