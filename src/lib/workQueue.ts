import amqp = require('amqplib');

let connection:amqp.Connection = null
export const channels = {}

export const cancelTimeOutTask = async (connectionString: string, taskName: string, id:string) => {
  if (!connection) {
    connection = await amqp.connect(connectionString)
  }
  const channel = await connection.createChannel()
  const result = await channel.purgeQueue(`${taskName}.${id}`)
  return result
}

export const timeOutTask = async (connectionString: string, taskName: string, delaySec: number, id:string, message:string) => {
  if (!connection) {
    connection = await amqp.connect(connectionString)
  }
  const channel = await connection.createChannel()
  channel.assertQueue(`${taskName}.${id}`, {
    durable: true,
    messageTtl: delaySec * 1000,
    deadLetterExchange: '',
    deadLetterRoutingKey: `${taskName}`
  })
  channel.sendToQueue(`${taskName}.${id}`, Buffer.from(message), {
    persistent: true
  })
}

export const task = async (connectionString: string, taskName: string, message: string, correlationId?: string, callback? :Function) => {
  if (!connection) {
    connection = await amqp.connect(connectionString)
  }
  const channel = await connection.createChannel()
  if (correlationId && callback) {
    const q = await channel.assertQueue('', {
      durable: true,
      exclusive: true
    })
    // const q = await queuePromise
    channel.consume(q.queue, function (msg: any) {
      if (msg.properties.correlationId === correlationId) {
        callback(msg)
      }
    }, {
      noAck: true
    })
    channel.sendToQueue(taskName,
      Buffer.from(message), {
        correlationId: correlationId,
        replyTo: q.queue
      })
  } else {
    channel.assertQueue(taskName, {
      durable: true
    })
    channel.sendToQueue(taskName, Buffer.from(message), {
      persistent: true
    })
  }
}
export const worker = async (connectionString: string, taskName: string, callback: Function) => {
  if (!connection) {
    connection = await amqp.connect(connectionString)
  }
  const channel = await connection.createChannel()
  channel.assertQueue(taskName, {
    durable: true
  })
  channel.prefetch(1)
  console.log('Waiting for messages in %s.', taskName)
  channel.consume(taskName, function (msg: any) {
    console.log('Received %s', msg.content.toString())
    const r = callback(msg)
    if (msg.properties.correlationId) {
      channel.sendToQueue(msg.properties.replyTo,
        Buffer.from(r.toString()), {
          correlationId: msg.properties.correlationId
        }
      )
    }

    channel.ack(msg)
  }, {
    noAck: false
  })
}
