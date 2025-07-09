const postResponse = {
  success: true,
  message: "Winner winner, chicken dinner",
  id: 123,
}

export const startMock = {
  name: '/pup/:pup/enable',
  method: 'post',
  group: 'pup actions',
  res: postResponse
}

export const stopMock = {
  name: '/pup/:pup/disable',
  method: 'post',
  group: 'pup actions',
  res: postResponse
}

export const installMock = {
  name: '/todo/:pup/install',
  method: 'post',
  group: 'pup actions',
  res: postResponse
}

export const uninstallMock = {
  name: '/pup/:pup/uninstall',
  method: 'post',
  group: 'pup actions',
  res: postResponse
}

export const purgeMock = {
  name: '/pup/:pup/purge',
  method: 'post',
  group: 'pup actions',
  res: postResponse
}

export const importBlockchainMock = {
  name: '/pup/:pup/import-blockchain',
  method: 'post',
  group: 'pup actions',
  res: postResponse
}