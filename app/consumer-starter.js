const {Consumer, ConsumerGroup, KafkaClient, Admin} = require('kafka-node');
const R = require('ramda');
const {log} = require('loggy-log');

const kafkaClient_ = new KafkaClient({kafkaHost: process.env.KAFKA_URL});

kafkaClient_.on('ready', () => {
    log('info', `client kafka ready`);
});

kafkaClient_.on('error', err => {
    log('error', `client kafka error: ${err}`);
});

const getListOfTopics_ = () =>
    new Promise(resolve => {
        const admin = new Admin(
            new KafkaClient({kafkaHost: process.env.KAFKA_URL})
        );
        admin.listTopics((err, res) => {
            R.when(R.not(err), resolve(res));
        });
    });

const checkTopicCreated_ = (resolve, topic) =>
    R.then(
        R.pipe(
            R.last,
            R.prop('metadata'),
            R.keys,
            R.ifElse(R.includes(topic), resolve, () =>
                setTimeout(
                    () => checkTopicCreated_(resolve, topic),
                    Number(process.env.TIMEOUT_CONSUMER)
                )
            )
        )
    )(getListOfTopics_());

const waitForTopics_ = topic =>
    new Promise(resolve => checkTopicCreated_(resolve, topic));

const parseMissive_ = (message, fn) =>
    R.pipe(
        R.prop('value'),
        JSON.parse,
        fn
    )(message);

const consumerGroupKryptonopolis = (topic,fn) => {
    const consumerOptions = {
        kafkaHost: process.env.KAFKA_URL,
        id: 'consumerKryptonopolis',
        groupId: 'kafka-node-krypto',
        sessionTimeout: 15000,
        protocol: ['roundrobin'],
        fromOffset: 'earliest'
    };
    const consumerGroup = new ConsumerGroup(consumerOptions, [topic]);
    consumerGroup.on('error', log('error'));
    consumerGroup.on('message', message => parseMissive_(message, fn));
};

const consumerSimple = (topic,fn) => {
    const consumer = new Consumer(
        new KafkaClient({kafkaHost: process.env.KAFKA_URL}),
        [{topic}],
        {
            autoCommit: true
        }
    );
    consumer.on('message', message => parseMissive_(message, fn));
    consumer.on('error', log('error'));
};

const connectAndStartConsumer_ = (topic, fn) => {
    if (topic === 'Kryptonopolis') {
        consumerGroupKryptonopolis(topic, fn);
    } else {
        consumerSimple(topic, fn);
    }
    log('info', `consumer of ${topic} created`);
};

const startConsumer = (topic, fn) =>
    R.pipe(
        waitForTopics_,
        R.then(() => connectAndStartConsumer_(topic, fn))
    )(topic);

module.exports = {startConsumer};