const phillips = require('phillips');

const api = new phillips.DefaultApi();
const controlLightRequest = phillips.ControlLightRequest.constructFromObject({
    deviceId: 'light1',
    power: 'on',
    brightness: 99,
    color: '#ffffff',
});

api.controlLight(controlLightRequest).then(function(data) {
  console.log('API called successfully. Returned data:\n' + JSON.stringify(data, undefined, 2));
}, function(error) {
  console.error(error);
});
