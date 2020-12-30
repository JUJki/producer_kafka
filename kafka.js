const {KafkaClient, Producer, KeyedMessage} = require('kafka-node');
const R = require('ramda');

const stringifyMessageTopic_ = (to, objectMessage) =>
  R.pipe(R.assoc('to', to), JSON.stringify)(objectMessage);

const formatAllMessages_ = (to, messages) =>
  R.map(message => stringifyMessageTopic_(to, message), messages);

const getPayloadBase_ = (to, topic, messages) =>
  R.pipe(
    () => R.objOf('messages', formatAllMessages_(to, messages)),
    R.assoc('topic', topic)
  )();

const getPayload_ = (to, topic, messages) =>
  R.pipe(
    () => getPayloadBase_(to, topic, messages),
    R.of,
    R.tap(console.log)
  )();

const getPayloadWithKey_ = (to, topic, messages, objectKeyPartition) =>
  R.pipe(
    () => getPayloadBase_(to, topic, messages),
    R.over(
      R.lensProp('messages'),
      R.map(
        message => new KeyedMessage(R.prop('key', objectKeyPartition), message)
      )
    ),
    R.assoc('key', R.prop('key', objectKeyPartition)),
    R.assoc('partition', R.prop('partition', objectKeyPartition)),
    R.of
  )();

const getOptionPartitionType_ = type =>
  R.ifElse(
    () => R.has(type, Producer.PARTITIONER_TYPES),
    R.always(
      R.objOf('partitionerType', R.prop(type, Producer.PARTITIONER_TYPES))
    ),
    R.always({})
  )();

const sendToKafkaBis = (topic, to, messages, partitionerType = 'default') =>
  new Promise((resolve, reject) => {
    console.log(partitionerType);
    console.log(getOptionPartitionType_(partitionerType));
    const client = new KafkaClient({kafkaHost: process.env.KAFKA_URL});
    const producer = new Producer(
      client,
      getOptionPartitionType_(partitionerType)
    );

    producer.on('ready', () => {
      console.log('Producer ready');
      producer.send(getPayload_(to, topic, messages), () => {
        console.log('Payload sent');
        client.close(resolve);
      });
    });
    producer.on('error', error => reject(error));
  });

const sendToKafkaWithKey = (
  topic,
  to,
  messages,
  objectKeyPartition,
  partitionerType = 'keyed'
) =>
  new Promise((resolve, reject) => {
    console.log('Topic :', topic);
    console.log('to :', to);
    console.log('messages :', messages);
    console.log('key :', R.prop('key', objectKeyPartition));
    console.log('partition :', R.prop('partition', objectKeyPartition));
    console.log('partitionType :', getOptionPartitionType_(partitionerType));
    const client = new KafkaClient({kafkaHost: process.env.KAFKA_URL});
    const producer = new Producer(
      client,
      getOptionPartitionType_(partitionerType)
    );

    producer.on('ready', () => {
      console.log('Producer ready');
      producer.send(
        getPayloadWithKey_(to, topic, messages, objectKeyPartition),
        () => {
          console.log('Payload sent');
          client.close(resolve);
        }
      );
    });
    producer.on('error', error => reject(error));
  });

module.exports = {sendToKafkaBis, sendToKafkaWithKey};
