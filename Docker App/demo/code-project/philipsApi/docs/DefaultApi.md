# Phillips.DefaultApi

All URIs are relative to *http://iot.informatik.uni-mannheim.de:3008/api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**controlLight**](DefaultApi.md#controlLight) | **POST** /state | 



## controlLight

> ControlLightResponse controlLight(controlLightRequest)



Set the state of a certain light bulb

### Example

```javascript
import Phillips from 'phillips';

let apiInstance = new Phillips.DefaultApi();
let controlLightRequest = new Phillips.ControlLightRequest(); // ControlLightRequest | 
apiInstance.controlLight(controlLightRequest).then((data) => {
  console.log('API called successfully. Returned data: ' + data);
}, (error) => {
  console.error(error);
});

```

### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **controlLightRequest** | [**ControlLightRequest**](ControlLightRequest.md)|  | 

### Return type

[**ControlLightResponse**](ControlLightResponse.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: application/json

