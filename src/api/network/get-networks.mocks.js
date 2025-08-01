export const getResponse = {
  name: "/networks/list",
  group: "networks",
  method: "get",
  res: {
    success: true,
    networks: [
      { type: "ethernet", interface: "eth0" },
      { type: "ethernet", interface: "eth1" },
      {
        type: "wifi",
        interface: "wlan0",
        ssids: [
          {
            ssid: "DogeBox",
            bssid: "AA:AA:AA:AA:AA:AA:AA:AA",
            encryption: "WPA2",
            quality: 0.85,
            signal: "-45dBm"
          },
          {
            ssid: "Open Network",
            bssid: "BB:BB:BB:BB:BB:BB:BB:BB",
            quality: 0.80,
            signal: "-55dBm"
          },
          {
            ssid: "Fair Signal Network",
            bssid: "CC:CC:CC:CC:CC:CC:CC:CC",
            quality: 0.50,
            signal: "-65dBm"
          },
          {
            ssid: "Poor Signal Network",
            bssid: "DD:DD:DD:DD:DD:DD:DD:DD",
            quality: 0.25,
            signal: "-75dBm"
          }
        ]
      }
    ],
  }
}
