export const getSSHPublicKeysResponse = {
  name: "/system/ssh/keys",
  group: "SSH",
  method: "get",
  res: {
    success: true,
    keys: [
      {
        dateAdded: "2024-12-03T15:04:05.123456789Z",
        key: "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDFt8vWZ9D2SePDzF6eS8T2KDP2q9vVHpf9HKx9IU8vB4UHN5V5Up7U3SEQVHKEp4DtRVVptYHqq2MmB2SyGCERr6+z5mZxy+7zLlzKTcW+gMP4M7iLvg5AaWjx0gUDxE1zjcTYa0Vd8M7K8JwsjLq9ExwL+cAv8TzlsqzF5UNw/Xc8",
        id: "XYZ789"
      },
      {
        dateAdded: "2024-11-27T07:30:22.987654321Z",
        key: "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIKHEOLLbeZr1DtUHJ/J7jOsCPtBE6KZVPk0LR4memYWK",
        id: "DEF456"
      },
      {
        dateAdded: "2023-06-03T23:59:59.234567890Z",
        key: "ecdsa-sha2-nistp256 AAAAE2VjZHNhLXNoYTItbmlzdHAyNTYAAAAIbmlzdHAyNTYAAABBBJnNlh8kzYX9xww4hPuTsGQMqA9T4bwGxXXzPVHZz6ROCS8OL6bJ6UF1Qe/bsG4j7KHFZJD8usdHSgztnxQOyXM=",
        id: "MNO123"
      }
    ],
  }
};

export const deleteSSHPublicKeyResponse = {
  name: "/system/ssh/key/:id",
  group: "SSH",
  method: "delete",
  res: {
    success: true,
  }
}

export const addSSHPublicKeyResponse = {
  name: "/system/ssh/key",
  group: "SSH",
  method: "put",
  res: {
    success: true,
  }
}

export const updateSSHStateResponse = {
  name: "/system/ssh/state",
  group: "SSH",
  method: "put",
  res: {
    success: true,
  }
}

export const getSSHStateResponse = {
  name: "/system/ssh/state",
  group: "SSH",
  method: "get",
  res: {
    success: true,
    enabled: true
  }
}
