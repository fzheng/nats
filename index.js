'use strict';

const Hemera = require('nats-hemera');
const HemeraJoi = require('hemera-joi');
const nats = require('nats').connect();

const hemera = new Hemera(nats, {
  logLevel: 'info',
});

hemera.use(HemeraJoi);

(async () => {
  try {
    // establish connection and bootstrap hemera
    await hemera.ready();

    const Joi = hemera.joi;

    // define your first server action
    hemera.add({
      topic: 'math',
      cmd: 'add',
      a: Joi.number().required(),
      b: Joi.number().required(),
    }, async req => req.a + req.b);

    hemera.log.info('service listening');

    // start first request
    let response = await hemera.act({
      topic: 'math',
      cmd: 'add',
      a: 10,
      b: 10,
    });
    hemera.log.info(response.data);

    // keep the parent "context" to retain meta and trace informations
    response = await response.context.act({
      topic: 'math',
      cmd: 'add',
      a: 10,
      b: 10,
    });
    hemera.log.info(response.data);
  } catch (err) {
    hemera.log.error(err);
    process.exit(1);
  }
})();
