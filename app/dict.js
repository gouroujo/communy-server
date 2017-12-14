const mb_auth_org = [
  'event_list',
  'event_view',
  'event_answer',
  'user_view'
];
const mod_auth_org = mb_auth_org.concat([
  'user_list',
  'event_delete',
  'event_edit',
  'event_add_user',
  'event_create',
  'add_user',
  'set_mod_role'
]);
const ad_auth_org = mod_auth_org.concat([
  'remove_user',
  'edit',
  'delete',
  'set_ad_role',
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
    ad: ad_auth_org,
  },
}
