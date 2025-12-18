export const mock = {
  name: '/system/stats',
  method: 'get',
  group: 'monitoring',
  res: generateSystemStats
};

function generateSystemStats() {
  return {
    cpu: {
      label: 'CPU Usage',
      type: 'float',
      values: generateRandomValues(30, 0, 100),
      current: Math.floor(Math.random() * 100)
    },
    ram: {
      label: 'Memory Usage',
      type: 'float',
      values: generateRandomValues(30, 20, 80),
      current: Math.floor(Math.random() * 60) + 20,
      total: 8192, // MB
      used: Math.floor(Math.random() * 4096) + 2048 // MB
    },
    disk: {
      label: 'Disk Usage',
      type: 'float',
      values: generateRandomValues(30, 40, 60),
      current: Math.floor(Math.random() * 20) + 40,
      total: 500000, // MB
      used: Math.floor(Math.random() * 200000) + 150000 // MB
    }
  };
}

function generateRandomValues(count, min, max) {
  return Array.from({ length: count }, () => 
    Math.floor(Math.random() * (max - min)) + min
  );
}

