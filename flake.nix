{
  inputs = {
    nixpkgs.url     = "github:NixOS/nixpkgs/nixos-25.11";
    flake-utils.url = "github:numtide/flake-utils";
    playwright.url  = "github:pietdevries94/playwright-web-flake";

    dogeboxd-src = {
      url = "github:Dogebox-WG/dogeboxd";
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
          '';
        };

        packages.default = pkgs.buildNpmPackage {
          name = "dpanel";
          src = ./.;

          npmDepsHash = "sha256-YP43a4VnimwKibfXwAoQBSu9CtEaCujlcGhxuyM/wLs=";

          nativeBuildInputs = [ pkgs.protobuf ];

          preBuild = ''
            export PATH="$PWD/node_modules/.bin:$PATH"
            protoc \
              --es_out=src/gen \
              --es_opt=target=ts \
              -I ${dogeboxd-src}/protocol \
              -I ${protovalidate-src}/proto/protovalidate \
              authenticate/v1/authenticate.proto \
              buf/validate/validate.proto
          '';

          buildPhase = ''
            npm run build
          '';

          installPhase = ''
            cp -r dist $out
          '';

          meta = with pkgs.lib; {
            description = "Dogebox control panel web interface";
            homepage = "https://github.com/dogeorg/dpanel";
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

        dbxSessionName = "dpanel";
        dbxStartCommand = "npm start";
        dbxCWD = "dev";
      }
    );
}
