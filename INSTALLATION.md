**This file may be outdated as the installation method might change over time. Please open an issue on GitHub if you encounter any problems.**

# Installing VerifyWise

Currently, the recommended method for installing VerifyWise is via Docker. A development environment can also be set up via `npm`. Both options are described below.

## Installing VerifyWise via Docker

To use VerifyWise via Docker, you will need a `.env.prod` file and an `install.sh` file.

### Docker setup

To set up VerifyWise in Docker, do the following:

1. From the root of our [GitHub repository](https://github.com/bluewave-labs/verifywise), download `.env.prod` and an `install.sh` file.
2. Move all the downloaded files to the directory where your VerifyWise container will be running. This directory will be referred to as your working directory from now on.
3. Start your local Docker instance.
4. In your working directory, open a bash terminal.
5. Run `chmod +x ./install.sh` followed by `./install.sh`.

#### Note: The `.env` file is configured with default settings. Alternatively, you can provide your own `.env` file.

## Developer Setup for VerifyWise via `npm`

Developers may prefer to run the VerifyWise server and client separately via `npm`.

To run VerifyWise's server and client via `npm`, follow these steps:

1. Fork our [GitHub repository](https://github.com/bluewave-labs/verifywise).
2. Clone your fork of the VerifyWise repository.
3. From the root directory of the repository (`./`), go to `./Clients` and run `npm i; npm run dev`.
   The VerifyWise client will start.
4. From the root directory of the repository, go to `./Servers` and run `npm i; npm run watch`.
   The VerifyWise server will start.

You can now access the VerifyWise frontend by navigating to `http://localhost:5173` in a local web browser.
