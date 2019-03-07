# exodus-iot-db

DB Module to handle the Entities in our IoT Platform using Sequelize ORM

## Usage

```js
import db = require('./index.js')

const config = {
  database: 'iot',
  username: 'exodus',
  password: 'exodus',
  host: 'localhost',
  dialect: 'sqlite'
}

const { Agent, Metric } = await db(config).catch( err => console.error(err) )

```