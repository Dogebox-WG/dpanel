import type { MockDescriptor, MockResOptions } from "../client.js";

export const mock: MockDescriptor = {
  name: '/system/services',
  method: 'get',
  group: 'monitoring',
  res: generateServicesResponse
};

export const mockTailscale: MockDescriptor = {
  name: 'Tailscale',
  method: 'get',
  group: 'monitoring',
  res: () => ({ enabled: true })
};

interface MockService {
  id: string;
  name: string;
  configured: boolean;
  status: {
    connected: boolean;
    ip: string | null;
    hostname: string | null;
  };
}

function generateServicesResponse(path: string, { networkContext }: MockResOptions) {
  // Check if Tailscale mock is enabled
  const tailscaleEnabled = networkContext?.['mock::monitoring::Tailscale::get'] === true;

  console.log('[Services Mock] Tailscale enabled:', tailscaleEnabled);

  const services: MockService[] = [];
  
  // Add Tailscale if enabled
  if (tailscaleEnabled) {
    const isConnected = Math.random() > 0.1; // 90% chance connected
    services.push({
      id: 'tailscale',
      name: 'Tailscale',
      configured: true,
      status: {
        connected: isConnected,
        ip: isConnected ? '100.64.' + Math.floor(Math.random() * 255) + '.' + Math.floor(Math.random() * 255) : null,
        hostname: isConnected ? 'dogebox-' + Math.floor(Math.random() * 1000).toString().padStart(4, '0') : null
      }
    });
  }
  
  // Future services would be added here by backend:
  // { id: 'openvpn', name: 'OpenVPN', configured: false, status: null },
  // { id: 'wireguard', name: 'WireGuard', configured: false, status: null }
  
  return {
    available: services
  };
}

