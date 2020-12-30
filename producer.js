const {serverlessHandler} = require('serverless-provider-handler');
const R = require('ramda');
const {sendToKafkaBis} = require('./kafka');
const {sendToKafkaWithKeyCatched} = require('./utils/kafka');

const producer_ = model =>
  R.pipe(
    data => sendToKafkaBis('Kryptonopolis', 'trains', data, 'random'),
    () => ({test: 'ok'})
  )(model);

const producerElasticSearch_ = model =>
  R.pipe(
    R.of,
    data => sendToKafkaBis('ElasticSearch', 'train', data),
    () => ({test: 'ok'})
  )(model);

const producerSimple_ = model =>
  R.pipe(
    R.of,
    data => sendToKafkaBis('Vanaheim', 'simple', data),
    () => ({test: 'ok'})
  )(model);

const producerKeyedCompaction_ = model =>
  R.pipe(
    R.of,
    data => sendToKafkaWithKeyCatched('Kryptonopolis', 'train', 'ddd', data),
    () => ({test: 'ok'})
  )(model);

const producerKafka = serverlessHandler(producer_);

const producerElasticSearch = serverlessHandler(producerElasticSearch_);

const producerSimple = serverlessHandler(producerSimple_);

const producerKeyedCompaction = serverlessHandler(producerKeyedCompaction_);

module.exports = {
  producerKafka,
  producerSimple,
  producerElasticSearch,
  producerKeyedCompaction
};
