const {
  sendToKafka,
  sendToKafkaWithKey
} = require('@tcf_team/send-json-to-kafka-queue');
const R = require('ramda');
const {logger} = require('./logger');

const randomPartition = ['Kryptonopolis', 'Monitor'];

const getPartitionTypeByTopic_ = topic =>
  R.ifElse(
    () => R.includes(topic, randomPartition),
    R.always('random'),
    R.always('default')
  )();

const sendToKafkaCatched = R.curry((topic, to, message) => {
  logger.log('info', `params sendToKafkaCatched : ${topic}, ${to}, ${message}`);
  return sendToKafka(topic, to, message, getPartitionTypeByTopic_(topic)).catch(
    () => {
      R.pipe(R.tap(() => logger.log('error', 'error in sendToKafka')));
    }
  );
});

const sendToKafkaWithKeyCatched = R.curry((topic, to, key, message) => {
  const partition = key.charCodeAt(0) % 2 === 0 ? 0 : 1;
  logger.log(
    'info',
    `params sendToKafkaWithKeyCatched: ${topic}, ${to}, ${message}, ${key}, ${partition}`
  );
  return sendToKafkaWithKey(topic, to, message, {key, partition}).catch(() => {
    R.pipe(
      R.tap(() =>
        logger.log(
          'error',
          `error in sendToKafka with key: ${key}, partition: ${partition}`
        )
      )
    );
  });
});

module.exports = {sendToKafkaCatched, sendToKafkaWithKeyCatched};
