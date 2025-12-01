export const mock = {
  name: '/system/services',
  method: 'get',
  group: 'monitoring',
  res: generateServicesResponse
};

function generateServicesResponse() {
  // Simulates backend response for available/configured services
  // Only Tailscale for now - extensible for future services
  return {
    available: [
      {
        id: 'tailscale',
        name: 'Tailscale',
        configured: true,
        status: {
          ip: '100.64.0.' + Math.floor(Math.random() * 255),
          connected: Math.random() > 0.1, // 90% chance connected
          hostname: 'dogebox-' + Math.floor(Math.random() * 1000)
        }
      }
      // Future services would be added here by backend:
      // { id: 'openvpn', name: 'OpenVPN', configured: false, status: null },
      // { id: 'wireguard', name: 'WireGuard', configured: false, status: null }
    ]
  };
}

