import { OrderControllers } from '../controller/OrderController'

export default [{
  method: 'get',
  route: '/orders',
  controller: OrderControllers,
  action: 'all'
}, {
  method: 'put',
  route: '/orders/cancel/:id',
  controller: OrderControllers,
  action: 'cancel'
}, {
  method: 'post',
  route: '/orders/create',
  controller: OrderControllers,
  action: 'create'
}]
