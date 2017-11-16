module.exports = (network, { organisationId }, { auth, loaders }) => {
  if (!auth) return null;
  if (!auth.check(`network:${network._id}:partnership_view`)) return null;

  return loaders.NetworkPartnershipForOrganisation(organisationId).load(network._id)
}
