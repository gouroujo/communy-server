const mb_auth_org = [
  'event_list',
  'event_view',
  'event_answer',
  'user_list',
  'user_view'
];
const mod_auth_org = mb_auth_org.concat([
  'event_delete',
  'event_edit',
  'event_add_user',
  'add_user'
]);

const mb_auth_net = [
  'event_list',
  'event_view',
  'event_answer',
  'organisation_list'
];
const mod_auth_net = mb_auth_net.concat([

]);

module.exports = {
  roles: {
    MEMBER: 'mb',
    MODERATOR: 'mod',
    ADMIN: 'ad',
  },
  answers: {
    YES: 'yes',
    NO: 'no',
    MAYBE: 'mb',
  },
  orgPermissions: {
    mb: mb_auth_org,
    mod: mod_auth_org,
    ad: ['*']
  },
  networkPermissions: {
    mb: mb_auth_net,
    mod: mod_auth_net,
    ad: ['*']
  }
}
