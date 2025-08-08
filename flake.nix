{
  inputs = {
    nixpkgs.url     = "github:NixOS/nixpkgs/nixos-25.05";
    flake-utils.url = "github:numtide/flake-utils";
    playwright.url  = "github:pietdevries94/playwright-web-flake";
  };

  outputs = inputs@{ self, nixpkgs, flake-utils, playwright, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        overlay = final: prev: {
            inherit (playwright.packages.${system}) playwright-test playwright-driver;
        };
        pkgs = import nixpkgs {
            inherit system;
            overlays = [ overlay ];
        };
      in {
        devShells.default = pkgs.mkShell {
          buildInputs = [ pkgs.nodejs_24 pkgs.screen 
            pkgs.playwright-test
          ];

          shellHook = ''
            export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
            export PLAYWRIGHT_BROWSERS_PATH="${pkgs.playwright-driver.browsers}"
          '';
        };

        dbxSessionName = "dpanel";
        dbxStartCommand = "npm start";
        dbxCWD = "dev";
      }
    );
}
