import { getRepository } from 'typeorm'
import { NextFunction, Request, Response } from 'express'
import { Order, OrderStatus } from '../entity/Order'
import { task, timeOutTask, cancelTimeOutTask } from '../lib/workQueue'

export class OrderControllers {
  private orderRepository = getRepository(Order);

  async all (request: Request, response: Response, next: NextFunction) {
    console.log('all')
    return this.orderRepository.find()
  }

  async create (request: Request, response: Response, next: NextFunction) {
    const { RABBITMQ_CONNECTION_STRING, PAYMENT_TASK_NAME, DELIVER_TASK_NAME, DELIVERED_DELAY_SEC = '30' } = process.env
    const result = await this.orderRepository.save({ pin: request.body.pin })
    await task(RABBITMQ_CONNECTION_STRING, PAYMENT_TASK_NAME, JSON.stringify(result), result.id, (msg: any) => {
      const isComfirm = JSON.parse(msg.content.toString())
      const status = isComfirm ? OrderStatus.CONFIRMED : OrderStatus.CANCELLED
      if (status === OrderStatus.CONFIRMED) {
        timeOutTask(RABBITMQ_CONNECTION_STRING, DELIVER_TASK_NAME, parseInt(DELIVERED_DELAY_SEC), msg.properties.correlationId, msg.properties.correlationId)
      }
      this.orderRepository.findOne(msg.properties.correlationId).then((order) => {
        this.orderRepository.update(order, {
          status
        })
      })
    })
    return result
  }

  async cancel (request: Request, response: Response, next: NextFunction) {
    const order = await this.orderRepository.findOne(request.params.id)
    if (order.status === OrderStatus.CONFIRMED) {
      const { RABBITMQ_CONNECTION_STRING, DELIVER_TASK_NAME } = process.env
      await cancelTimeOutTask(RABBITMQ_CONNECTION_STRING, DELIVER_TASK_NAME, request.params.id)
    }
    const result = await this.orderRepository.update(order, {
      status: OrderStatus.CANCELLED
    })
    return result
  }

  async del (id: string) {
    const order = await this.orderRepository.findOne(id)
    const result = await this.orderRepository.update(order, {
      status: OrderStatus.DELIVERED
    })
    return result
  }
}
