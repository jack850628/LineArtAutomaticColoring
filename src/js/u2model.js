import * as tf from '@tensorflow/tfjs';

var model;

function loadModel(m){
    model = m;
    console.debug('model', m, m.apply);
}

export function generator(inputCanvas, outputCanvas){
    var imageTensor = tf.browser.fromPixels(inputCanvas);
    var poi = imageTensor
    imageTensor = tf.sub(tf.div(imageTensor, 127.5), 1);
    console.debug('????', imageTensor.dataSync());
    imageTensor = tf.cast(imageTensor, 'float32')
    imageTensor = tf.expandDims(imageTensor, 0)
    console.debug(imageTensor);
    model.apply(imageTensor, {training: true}).data()
        .then(function(result){
            result = tf.reshape(result, [256, 256, 3]);
            result = tf.add(tf.mul(result, 0.5), 0.5);
            // result = result.asType('int32');
            // result = result.squeeze();
            // result = tf.add(tf.mul(result, 127.5), 1);
            console.debug(poi, result, result.dataSync());
            tf.browser.toPixels(result, outputCanvas);
        });
}

export function waitModelLoad(){
    function check(resolve, reject){
        if(model){
            resolve(true);
        }else{
            setTimeout(()=>check(resolve, reject))
        }
    }
    return new Promise(check);
}

tf.loadLayersModel('./tfmodel/model.json').then(loadModel);