{
  inputs = {
    nixpkgs.url     = "github:NixOS/nixpkgs/nixos-25.11";
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

            if [ ! -d node_modules/@deform-wg/deform ]; then
              echo "Installing root npm dependencies..."
              npm install
            fi
          '';
        };

        packages.default = pkgs.buildNpmPackage {
          name = "dpanel";
          src = ./.;

          npmDepsHash = "sha256-PXFofm088q5JHXwj4bowjoq2ckiEKtoltUH1jnL6tuI=";

          buildPhase = ''
            npm run build
          '';

          installPhase = ''
            cp -r dist $out
          '';

          meta = with pkgs.lib; {
            description = "Dogebox control panel web interface";
            homepage = "https://github.com/Dogebox-WG/dpanel";
            license = licenses.mit;
          };
        };

        packages.test = pkgs.writeShellApplication {
          name = "dpanel-test";
          runtimeInputs = [ pkgs.nodejs_24 pkgs.playwright-test ];
          text = ''
            set -euo pipefail

            if [ ! -f package.json ] || [ ! -d dev ]; then
              echo "Run dpanel-test from the dpanel repository root." >&2
              exit 1
            fi

            if [ ! -d node_modules/@deform-wg/deform ]; then
              echo "Installing root npm dependencies..."
              npm install
            fi

            cd dev
            npm install

            export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
            export PLAYWRIGHT_BROWSERS_PATH="${pkgs.playwright-driver.browsers}"
            exec npm test
          '';
        };

        apps.test = {
          type = "app";
          program = "${self.packages.${system}.test}/bin/dpanel-test";
        };

        dbxSessionName = "dpanel";
        dbxStartCommand = "npm start";
        dbxCWD = "dev";
      }
    );
}
