export const postResponse = {
  name: '/system/import-blockchain',
  method: 'post',
  group: 'system actions',
  res: {
    success: true,
    id: "import-blockchain-" + Math.random().toString(36).substring(2, 15),
    message: "Import blockchain action initiated"
  }
} 