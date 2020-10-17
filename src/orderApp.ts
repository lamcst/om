import 'reflect-metadata'
import { createConnection } from 'typeorm'
import { Request, Response } from 'express'
import * as bodyParser from 'body-parser'
import { Routes } from './routes'
const express = require('express')
import _ = require('lodash')
import dotenv = require('dotenv-parser')
dotenv.config()
const CONNECTION_PREFIX = 'TYPEORM'
const CONNECTION_SEPARATOR = '_'
const keys = Object.keys(process.env)
const options: any = keys.reduce((result, key) => {
  const data = process.env[key]
  const [prefix, ...optionArray] = key.split(CONNECTION_SEPARATOR)
  if (prefix === CONNECTION_PREFIX) {
    const keyCamelCased = _.camelCase(optionArray.join(CONNECTION_SEPARATOR))
    return {
      ...result,
      [keyCamelCased]: data
    }
  }
  return result
}, {})
const port = process.env.PORT
createConnection(options).then(async connection => {
  // create express app
  const app = express()
  app.use(bodyParser.json())

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

  // setup express app here
  // ...

  // start express server
  app.listen(port)

  console.log(`Express server has started on port ${port}. Open http://localhost:${port}/orders to see results`)
}).catch(error => console.log(error))
