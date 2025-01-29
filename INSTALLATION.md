# Installing VerifyWise

Currently, the recommended method of installing VerifyWise is via Docker. A development environment can also be set up via `npm`. Both options are described below.

## Installing VerifyWise via Docker

In order to use VerifyWise via Docker, you will need a `.env` file and a `docker-compose.yml` file.

### Docker setup

To set up VerifyWise in Docker, do the following:

1. From the root of our [GitHub repository,](https://github.com/bluewave-labs/verifywise) download `.env`, `docker-compose.yml`, `SQL_Commands_1.sql` and `SQL_Commands_2.sql`.
2. Move all the downloaded files to the directory where your VerifyWise container will be running. This directory will be referred to as your working directory from now on.
3. Update the `VITE_APP_API_HOST` to your server URL. <strong>Please do not keep the trailing `/` after the hostname.</strong>
4. Start your local Docker instance.
5. In your working directory, open bash terminal.
6. Run `chmod +x ./install.sh` followed by `./install.sh`.

#### NOTE: The `.env` file is configured as per the default settings. Alternatively, you can supply your own `.env` file.

## Developer Setup for VerifyWise via `npm`

Developers may prefer to run the VerifyWise server and client separately via `npm`.

To run VerifyWise's server and client via `npm`, follow these steps:

1. Fork our [GitHub repository](https://github.com/bluewave-labs/verifywise).
2. Clone your fork of the VerifyWise repository.
3. From the root directory of the repository (`./`), go to `./Clients` and run `npm i; npm run dev`.
The VerifyWise client will start.
4. From the root directory of the repository, go to `./Servers` and run `npm i; npm run watch`.
The VerifyWise server will start.

You can now access the VerifyWise frontend by navigating to `https://localhost/5173` on a local web browser.
