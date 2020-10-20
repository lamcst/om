import 'reflect-metadata'
import { createConnection } from 'typeorm'
import { Request, Response } from 'express'
import * as bodyParser from 'body-parser'
import { Routes } from './routes'
import { OrderWorker } from './controller/OrderController'
import getConnectionOptions from './lib/getConnectionOptions'
import cors = require('cors')
const express = require('express')
const options = getConnectionOptions()
const port = process.env.PORT
export const orderApp = () => {
  const app = express()
  app.use(bodyParser.json())
  app.use(cors())
  // register express routes from defined application routes
  Routes.forEach(route => {
    console.log(route.method, route.route);
    (app as any)[route.method](route.route, (req: Request, res: Response, next: Function) => {
      const result = (new (route.controller as any)())[route.action](req, res, next)
      if (result instanceof Promise) {
        result.then(result => result !== null && result !== undefined ? res.send(result) : undefined)
      } else if (result !== null && result !== undefined) {
        res.json(result)
      }
    })
  })

  return app
}
createConnection(options).then((connection) => {
  const app = orderApp()
  OrderWorker(connection)
  app.listen(port)
  console.log(`Express server has started on port ${port}. Open http://localhost:${port}/orders to see results`)
}).catch(error => console.log(error))
