module.exports = (organisation, { networkId }, { auth, loaders }) => {
  if (!auth) return null;
  if (!auth.check(`organisation:${organisation._id}:partnership_view`)) return null

  return loaders.OrganisationPartnershipForNetwork(networkId).load(organisation._id)
}
