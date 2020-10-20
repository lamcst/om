import { getRepository, Connection } from 'typeorm'
import { NextFunction, Request, Response } from 'express'
import { Order, OrderStatus } from '../entity/Order'
import { task, timeOutTask, cancelTimeOutTask, worker } from '../lib/workQueue'
export const OrderWorker = (connection:Connection) => {
  const { RABBITMQ_CONNECTION_STRING, DELIVER_TASK_NAME } = process.env
  worker(RABBITMQ_CONNECTION_STRING, DELIVER_TASK_NAME, (result:any) => {
    const id = result.content.toString()
    connection
      .createQueryBuilder()
      .update(Order)
      .set({ status: OrderStatus.DELIVERED })
      .where('id = :id', { id })
      .execute()
  })
}
export class OrderControllers {
  private orderRepository = getRepository(Order);

  async all (request: Request, response: Response, next: NextFunction) {
    return this.orderRepository.find({ order: { createTime: 'DESC' } })
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
      this.orderRepository.update(msg.properties.correlationId, {
        status
      })
    })
    return result
  }

  async cancel (request: Request, response: Response, next: NextFunction) {
    const order = await this.orderRepository.findOne(request.params.id)
    if (order.status === OrderStatus.CONFIRMED) {
      const { RABBITMQ_CONNECTION_STRING, DELIVER_TASK_NAME } = process.env
      cancelTimeOutTask(RABBITMQ_CONNECTION_STRING, DELIVER_TASK_NAME, request.params.id)
    }
    const cancelledStatus = OrderStatus.CANCELLED
    const result = await this.orderRepository.update(request.params.id, {
      status: cancelledStatus
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
