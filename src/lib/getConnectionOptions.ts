import { DotenvConfigOutput, DotenvConfigOptions } from 'dotenv'
import dotenv = require('dotenv-parser')
import _ = require('lodash')
export default (option? : DotenvConfigOptions) => {
  dotenv.config(option)
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
  return options
}
