const mb_auth = [
  'event_list',
  'event_view',
  'event_answer'
];
const mod_auth = mb_auth.concat([
  'event_delete',
  'event_edit',
  'event_add_user',
  'add_user'
]);

module.exports = {
  orgStatus: {
    MEMBER: 'mb',
    MODERATOR: 'mod',
    ADMIN: 'ad',
  },
  eventStatus: {
    YES: 'yes',
    NO: 'no',
    MAYBE: 'mb',
  },
  orgPermissions: {
    mb: mb_auth,
    mod: mod_auth,
    ad: ['*']
  }
}
