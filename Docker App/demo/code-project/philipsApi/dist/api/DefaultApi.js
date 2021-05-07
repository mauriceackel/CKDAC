"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ApiClient = _interopRequireDefault(require("../ApiClient"));

var _BadRequestResponse = _interopRequireDefault(require("../model/BadRequestResponse"));

var _ControlLightRequest = _interopRequireDefault(require("../model/ControlLightRequest"));

var _ControlLightResponse = _interopRequireDefault(require("../model/ControlLightResponse"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
* Default service.
* @module api/DefaultApi
* @version 1.0
*/
var DefaultApi = /*#__PURE__*/function () {
  /**
  * Constructs a new DefaultApi. 
  * @alias module:api/DefaultApi
  * @class
  * @param {module:ApiClient} [apiClient] Optional API client implementation to use,
  * default to {@link module:ApiClient#instance} if unspecified.
  */
  function DefaultApi(apiClient) {
    _classCallCheck(this, DefaultApi);

    this.apiClient = apiClient || _ApiClient["default"].instance;
  }
  /**
   * Set the state of a certain light bulb
   * @param {module:model/ControlLightRequest} controlLightRequest 
   * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link module:model/ControlLightResponse} and HTTP response
   */


  _createClass(DefaultApi, [{
    key: "controlLightWithHttpInfo",
    value: function controlLightWithHttpInfo(controlLightRequest) {
      var postBody = controlLightRequest; // verify the required parameter 'controlLightRequest' is set

      if (controlLightRequest === undefined || controlLightRequest === null) {
        throw new Error("Missing the required parameter 'controlLightRequest' when calling controlLight");
      }

      var pathParams = {};
      var queryParams = {};
      var headerParams = {};
      var formParams = {};
      var authNames = [];
      var contentTypes = ['application/json'];
      var accepts = ['application/json'];
      var returnType = _ControlLightResponse["default"];
      return this.apiClient.callApi('/state', 'POST', pathParams, queryParams, headerParams, formParams, postBody, authNames, contentTypes, accepts, returnType, null);
    }
    /**
     * Set the state of a certain light bulb
     * @param {module:model/ControlLightRequest} controlLightRequest 
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link module:model/ControlLightResponse}
     */

  }, {
    key: "controlLight",
    value: function controlLight(controlLightRequest) {
      return this.controlLightWithHttpInfo(controlLightRequest).then(function (response_and_data) {
        return response_and_data.data;
      });
    }
  }]);

  return DefaultApi;
}();

exports["default"] = DefaultApi;