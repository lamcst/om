# om
Tested Enviroment
* Windows 10
* Node 12.18.3

Development tools in use.
* VS code
* [ESlint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) extention in VS code 
* [Docker](https://www.docker.com/products/docker-desktop)

To run services
1. Install packages
~~~~npm 
  npm install
~~~~
2. Run mysql and rabbitmq on docker
~~~~npm 
  npm run dc-dev-u 
~~~~
3. Run order service/ payment service
~~~~npm 
  npm run start-order-dev / start-pay-dev
~~~~