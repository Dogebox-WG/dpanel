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
  # Uncomment below and replace with your auth key from:
  # https://login.tailscale.com/admin/settings/keys
  #
  # services.tailscale.enable = true;
  # services.tailscale.authKeyFile = pkgs.writeText "tailscale-authkey" "tskey-auth-XXXXX-XXXXXXXXXXXXXXXXX";
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

