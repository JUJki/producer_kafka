const {serverlessHandler} = require('serverless-provider-handler');
const {sendToKafka} = require('post-json-to-kafka');
const R = require('ramda');

const producer_ = model =>
    R.pipe(
        R.of,
        sendToKafka('Kryptonopolis', 'train'),
        () => ({'test': 'ok'})
    )(model);


const producerKafka = serverlessHandler(producer_);

module.exports = {producerKafka};
