const {serverlessHandler} = require('serverless-provider-handler');
const {sendToKafka} = require('post-json-to-kafka');
const R = require('ramda');

const fakeKrypto_ = model =>
    R.pipe(
        R.of,
        sendToKafka('Kryptonopolis', 'train'),
        () => ({'test': 'ok'})
    )(model);


const fakeKrypto = serverlessHandler(fakeKrypto_);

module.exports = {fakeKrypto};
