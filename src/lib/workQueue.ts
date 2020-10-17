import amqp = require('amqplib');

let connection = null
export const channels = {}

export const task = async (connectionString: string, taskName: string, message: string) => {
  if (!connection) {
    connection = await amqp.connect(connectionString)
  }
  const channel = await connection.createChannel()
  channel.assertQueue(taskName, {
    durable: true
  })
  channel.sendToQueue(taskName, Buffer.from(message), {
    persistent: true
  })
}
export const worker = async (connectionString: string, taskName: string, callback: Function) => {
  if (!connection) {
    connection = await amqp.connect(connection)
  }
  const channel = await connection.createChannel()
  channel.assertQueue(taskName, {
    durable: true
  })
  channel.prefetch(1)
  console.log('Waiting for messages in %s.', taskName)
  channel.consume(taskName, function (msg) {
    console.log('Received %s', msg.content.toString())
    callback(msg.content.toString())
    channel.ack(msg)
  }, {
    noAck: false
  })
}
