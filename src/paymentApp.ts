import { worker, task } from './lib/workQueue'
import dotenv = require('dotenv-parser')
dotenv.config()
const { RABBITMQ_CONNECTION_STRING, PAYMENT_TASK_NAME, PAYMENT_RETURN_TASK_NAME, PAYMENT_PIN } = process.env
worker(RABBITMQ_CONNECTION_STRING, PAYMENT_TASK_NAME, function (orderString:string) {
  const order = JSON.parse(orderString)
  const result = order.pin === PAYMENT_PIN
  task(RABBITMQ_CONNECTION_STRING, PAYMENT_RETURN_TASK_NAME, JSON.stringify(result))
})
