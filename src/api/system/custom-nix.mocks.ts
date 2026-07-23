export const getCustomNixResponse = {
  name: "/system/custom-nix",
  group: "Custom Nix",
  method: "get",
  res: {
    content: `{ config, pkgs, lib, ... }:

{
  # Custom NixOS Configuration
  # Add your custom NixOS modules and configuration here.
  # This file is included in the system configuration when it exists.
  
  # Example: Enable Tailscale VPN
  # 1. Uncomment the lines below
  # 2. Replace tskey-auth-XXXXX-XXXXXXXXXXXXXXXXX with your auth key from:
  #    https://login.tailscale.com/admin/settings/keys
  # 3. Save & Rebuild - Tailscale will auto-connect
  #
  # services.tailscale.enable = true;
  # services.tailscale.authKeyFile = "/etc/tailscale/authkey";
  # environment.etc."tailscale/authkey" = {
  #   text = "tskey-auth-XXXXX-XXXXXXXXXXXXXXXXX";
  #   mode = "0400";
  # };
  # environment.systemPackages = [ pkgs.tailscale ];
  # networking.firewall.trustedInterfaces = [ "tailscale0" ];
  # networking.firewall.allowedUDPPorts = [ 41641 ];
}
`,
    exists: false
  }
};

export const saveCustomNixResponse = {
  name: "/system/custom-nix",
  group: "Custom Nix",
  method: "put",
  res: {
    id: "mock-job-id"
  }
};

export const validateCustomNixResponse = {
  name: "/system/custom-nix/validate",
  group: "Custom Nix",
  method: "post",
  res: {
    valid: true
  }
};
