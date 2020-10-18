import { worker, task } from './lib/workQueue'
import dotenv = require('dotenv-parser')
dotenv.config()
const { RABBITMQ_CONNECTION_STRING, PAYMENT_TASK_NAME, PAYMENT_RETURN_TASK_NAME, PAYMENT_PIN } = process.env
worker(RABBITMQ_CONNECTION_STRING, PAYMENT_TASK_NAME, function (msg) {
  const order = JSON.parse(msg.content.toString())
  const isDelivered = Number(order.pin) === Number(PAYMENT_PIN)
  return isDelivered
})
