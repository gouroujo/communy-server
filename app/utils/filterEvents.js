module.exports = (events, { before, after, organisationId, status }) => (
  events
    .filter(e => (
      (before ? e.startTime <= before : true) &&
      (after ? e.endTime >= after : true) &&
      (organisationId ? (e.org || (e.organisation && e.organisation._id)) === organisationId : true) &&
      (status ? e.status === status : true)
    ))
)
