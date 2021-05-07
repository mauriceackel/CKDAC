"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ApiClient = _interopRequireDefault(require("../ApiClient"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * The ControlLightRequest model module.
 * @module model/ControlLightRequest
 * @version 1.0
 */
var ControlLightRequest = /*#__PURE__*/function () {
  /**
   * Constructs a new <code>ControlLightRequest</code>.
   * @alias module:model/ControlLightRequest
   */
  function ControlLightRequest() {
    _classCallCheck(this, ControlLightRequest);

    ControlLightRequest.initialize(this);
  }
  /**
   * Initializes the fields of this object.
   * This method is used by the constructors of any subclasses, in order to implement multiple inheritance (mix-ins).
   * Only for internal use.
   */


  _createClass(ControlLightRequest, null, [{
    key: "initialize",
    value: function initialize(obj) {}
    /**
     * Constructs a <code>ControlLightRequest</code> from a plain JavaScript object, optionally creating a new instance.
     * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
     * @param {Object} data The plain JavaScript object bearing properties of interest.
     * @param {module:model/ControlLightRequest} obj Optional instance to populate.
     * @return {module:model/ControlLightRequest} The populated <code>ControlLightRequest</code> instance.
     */

  }, {
    key: "constructFromObject",
    value: function constructFromObject(data, obj) {
      if (data) {
        obj = obj || new ControlLightRequest();

        if (data.hasOwnProperty('deviceId')) {
          obj['deviceId'] = _ApiClient["default"].convertToType(data['deviceId'], 'String');
        }

        if (data.hasOwnProperty('power')) {
          obj['power'] = _ApiClient["default"].convertToType(data['power'], 'String');
        }

        if (data.hasOwnProperty('color')) {
          obj['color'] = _ApiClient["default"].convertToType(data['color'], 'String');
        }

        if (data.hasOwnProperty('brightness')) {
          obj['brightness'] = _ApiClient["default"].convertToType(data['brightness'], 'Number');
        }
      }

      return obj;
    }
  }]);

  return ControlLightRequest;
}();
/**
 * @member {String} deviceId
 */


ControlLightRequest.prototype['deviceId'] = undefined;
/**
 * @member {module:model/ControlLightRequest.PowerEnum} power
 */

ControlLightRequest.prototype['power'] = undefined;
/**
 * @member {String} color
 */

ControlLightRequest.prototype['color'] = undefined;
/**
 * @member {Number} brightness
 */

ControlLightRequest.prototype['brightness'] = undefined;
/**
 * Allowed values for the <code>power</code> property.
 * @enum {String}
 * @readonly
 */

ControlLightRequest['PowerEnum'] = {
  /**
   * value: "on"
   * @const
   */
  "on": "on",

  /**
   * value: "off"
   * @const
   */
  "off": "off"
};
var _default = ControlLightRequest;
exports["default"] = _default;