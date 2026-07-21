{
  inputs = {
    nixpkgs.url     = "github:NixOS/nixpkgs/nixos-25.11";
    flake-utils.url = "github:numtide/flake-utils";
    playwright.url  = "github:pietdevries94/playwright-web-flake";

    dogeboxd-src = {
      url = "github:Dogebox-WG/dogeboxd/feat/proto";
      flake = false;
    };

    protovalidate-src = {
      url = "github:bufbuild/protovalidate";
      flake = false;
    };
  };
  
  outputs = inputs@{ self, nixpkgs, flake-utils, playwright, dogeboxd-src, protovalidate-src, ... }:
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

          npmDepsHash = "sha256-QuxwUdFRdZ8sPDTzLaap/CnMXJKG0YtHI+9CRUkpjdU=";

          nativeBuildInputs = [ pkgs.protobuf ];

          preBuild = ''
            export PATH="$PWD/node_modules/.bin:$PATH"
            mkdir -p src/gen
            find ${dogeboxd-src}/protocol ${protovalidate-src}/proto/protovalidate \
              -name '*.proto' -print0 \
              | xargs -0 protoc \
                --es_out=src/gen \
                --es_opt=target=ts \
                -I ${dogeboxd-src}/protocol \
                -I ${protovalidate-src}/proto/protovalidate
          '';

          buildPhase = ''
            runHook preBuild
            npm run build
            runHook postBuild
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

        packages.build-with-dev-overrides = pkgs.writeShellApplication {
          name = "build-with-dev-overrides";
          runtimeInputs = [ pkgs.git ];
          text = ''
            nix build .#packages.${system}.default \
              -L \
              --print-out-paths \
              --override-input dogeboxd-src "path:$(realpath ../dogeboxd)?rev=$(git -C ../dogeboxd log -1 --pretty=format:%H)" \
              --no-write-lock-file
          '';
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
