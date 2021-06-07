# Gabble Tool

## About
Gabble is a system integration tool that implements the Knowledge-Driven Architecture Composition approach. You can find more information about the tool and the approach [here](https://iot.informatik.uni-mannheim.de).

## How To
The application is a web app that is deployed via docker and docker compose.

### Prerequisites
Ensure that you have an up-to-date version of docker installed. [Link.](https://docs.docker.com/get-docker/)

*NOTE: On some systems it could come to an issue when WSL 2 is not activated in the docker settings. Please try enabling it if you encounter error when starting the application.* 

### Setup
The following installation instructions are for UNIX system. Windows installation follows accordingly.

1. Clone the repository: `git clone https://github.com/mauriceackel/Gabble`
2. Navigate to the cloned folder: `cd Gabble`
3. Checkout the demo branch: `git checkout demo`

*NOTE: Technically you only need the contents of the folder /Docker App/ to run the demo. However, make sure you get the data from the demo branch of the repository!*

### Start application
1. Inside the repository folder, navigate to the app folder: `cd Docker\ App`
2. Start the application with docker compose in daemon mode: `docker-compose up -d`

*NOTE: On the first start, this may take a while to download the docker containers. Consecutive executions will be faster.*

### Use application
After you have started the application and all containers are running, you can can open the application in your browser via: `http://localhost:8080`.

If you are asked to login, you can either create a new account (this will all be local, no data is transmitted) or use the root account with credentials `root@example.com` / `1234`.

The demo build of the application already has some data prepopulated in the database but you can also add additional interfaces and create your own mappings between them.

### Stop application
1. Inside the repository folder, navigate to the app folder: `cd Docker\ App`
2. Stop the application with docker compose: `docker-compose stop`

### Remove application
1. Inside the repository folder, navigate to the app folder: `cd Docker\ App`
2. If the app is running, stop the application with docker compose: `docker-compose stop`
3. Remove the docker compose app: `docker-compose rm`

## Use code adapters
To use the generated OpenAPI code adapter, you basically need to execute the exact same steps as if you created the code with the official OpenAPI code generator.

1. Unzip the downloaded folder
2. Copy the whole folder to your project
3. Navigate inside the folder and run `npm run provide` which will execute many of the manual steps automatically
4. Navigate back to your project folder
5. Run `npm link <path_to_adapter_folder>`
6. Exchange the import of the original source-interface library with the adapter (i.e. `require('philips')` -> `require('philips-adapter')`)

*NOTE: The name of the generated adapter library will always be the same as if the library was directly created with the OpenAPI code generator with an addition '-adapter' postfix.*
*NOTE: You can change the created adapter code to your liking. However, you will need to build the adapter code again after you make any changes.*

## Additional materials
You can find the OpenAPI descriptions of the sample interfaces in the folder `./Docker\ App/demo/apis`.

You find a sample code project with a Philips API client call in the folder `./Docker\ App/demo/code-project`.

You can find mockoon environments to mock the Philips and Yeelight API in `./Docker\ App/demo/Mockoon\ Apis.json`.