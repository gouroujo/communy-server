module.exports = {
  Partnership: {
    id(partnership) {
      return partnership._id;
    },
    joined(partnership) {
      return partnership.ack && partnership.confirm;
    },
    ack(partnership) {
      return partnership.ack
    },
    confirm(partnership) {
      return partnership.confirm
    },
    network(partnership, params, { getField}) {
      return getField('network', partnership, 'Partnership');
    },
    organisation(partnership, params, { getField}) {
      return getField('organisation', partnership, 'Partnership');
    }
  }
}
