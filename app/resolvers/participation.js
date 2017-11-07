module.exports = {
  Participation: {
    id(participation) {
      return participation._id;
    },
    answer(participation, params, { getField}) {
      return getField('answer', participation, 'Participation');
    },
    event(participation, params, { getField}) {
      return getField('event', participation, 'Participation');
    },
    user(participation, params, { getField}) {
      return getField('user', participation, 'Participation');
    },
    organisation(participation, params, { getField}) {
      return getField('organisation', participation, 'Participation');
    }
  }
}
