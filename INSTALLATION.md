# Installing VerifyWise

Currently, the recommended method of installing VerifyWise is via Docker. A development environment can also be set up via `npm`. Both options are described below.

## Installing VerifyWise via Docker

In order to use VerifyWise via Docker, you will need a `.env` file and a `docker-compose.yml` file.

### Docker setup

To set up VerifyWise in Docker, do the following:

1. From the root of our [GitHub repository,](https://github.com/bluewave-labs/verifywise) download `env-example` and `docker-compose.yml`.
2. Move `env-example` and `docker-compose.yml` to the directory where your VerifyWise container will be running. This directory will be referred to as your working directory from now on.
3. Open `env-example` in a text editor, modify environment variables as needed, and save your work to `.env`. Alternatively, you can supply your own `.env` file. 
4. Start your local Docker instance.
5. In your working directory, run `docker-compose up`.

### PostGreSQL setup

Now, you need to connect VerifyWise to your PostGreSQL database. We will use PgAdmin to demonstrate the process here with a completely new PostGreSQL instance.

1. Install and run PgAdmin.
2. Register a new server in PgAdmin. The following steps will all be carried out in the PgAdmin user interface.
3. Call the new instance `docker-postgres`.
4. Change the server port to the value of `LOCAL_DB_PORT`, as specified in your `.env` file. The default (in `env.example) is port `5433`.
5. Add DB_NAME (from `.env`) as the database username.
6. Add DB_PASSWORD (from `.env`) as the database password.
7. Save your changes.

You're done! By default, the VerifyWise backend runs on `localhost:3000` and the VerifyWise frontend runs on `localhost:8080`. This can be configured by modifying the `.env` file in your working directory.

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
