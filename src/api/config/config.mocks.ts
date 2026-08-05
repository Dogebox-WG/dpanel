export const postResponse = {
  name: '/config/:pup',
  method: 'post',
  group: 'pup config',
  res: {
    success: true,
    message: "Winner winner, chicken dinner",
    id: 123
  }
}

export const getResponse = {
  name: '/config/pup',
  method: 'get',
  group: 'pup config',
  res: {
    key: 'value',
  }
}

export const getAllResponse = {
  name: '/config',
  method: 'get',
  group: 'pup config',
  res: {
    'Core': {
      key: 'value',
    },
    'Identity': {
      key: 'value',
    },
    'GigaWallet': {
      key: 'value',
    }
  }
}