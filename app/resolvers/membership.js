module.exports = {
  Membership: {
    id(membership) {
      return membership._id;
    },
    joined(membership) {
      return membership.ack && membership.confirm;
    },
    ack(membership, params, { getField}) {
      return getField('ack', membership, 'Membership');
    },
    confirm(membership, params, { getField}) {
      return getField('confirm', membership, 'Membership');
    },
    user(membership, params, { getField}) {
      return getField('user', membership, 'Membership');
    },
    network(membership, params, { getField}) {
      return getField('network', membership, 'Membership');
    }
  }
}
