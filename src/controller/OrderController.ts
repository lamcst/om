import { getRepository } from 'typeorm'
import { NextFunction, Request, Response } from 'express'
import { Order, OrderStatus } from '../entity/Order'
import { task } from '../lib/workQueue'

export class OrderControllers {
  private orderRepository = getRepository(Order);

  async all (request: Request, response: Response, next: NextFunction) {
    console.log('all')
    return this.orderRepository.find()
  }

  async create (request: Request, response: Response, next: NextFunction) {
    const { RABBITMQ_CONNECTION_STRING, PAYMENT_TASK_NAME } = process.env
    const result = await this.orderRepository.save({ pin: request.body.pin })
    await task(RABBITMQ_CONNECTION_STRING, PAYMENT_TASK_NAME, JSON.stringify(result))
    return result
  }

  async cancel (request: Request, response: Response, next: NextFunction) {
    const order = await this.orderRepository.findOne(request.params.id)
    await this.orderRepository.update(order, {
      status: OrderStatus.CANCELLED
    })
  }
}
