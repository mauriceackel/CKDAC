"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ApiClient = _interopRequireDefault(require("../ApiClient"));

var _ControlLightResponseTime = _interopRequireDefault(require("./ControlLightResponseTime"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * The ControlLightResponse model module.
 * @module model/ControlLightResponse
 * @version 1.0
 */
var ControlLightResponse = /*#__PURE__*/function () {
  /**
   * Constructs a new <code>ControlLightResponse</code>.
   * @alias module:model/ControlLightResponse
   */
  function ControlLightResponse() {
    _classCallCheck(this, ControlLightResponse);

    ControlLightResponse.initialize(this);
  }
  /**
   * Initializes the fields of this object.
   * This method is used by the constructors of any subclasses, in order to implement multiple inheritance (mix-ins).
   * Only for internal use.
   */


  _createClass(ControlLightResponse, null, [{
    key: "initialize",
    value: function initialize(obj) {}
    /**
     * Constructs a <code>ControlLightResponse</code> from a plain JavaScript object, optionally creating a new instance.
     * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
     * @param {Object} data The plain JavaScript object bearing properties of interest.
     * @param {module:model/ControlLightResponse} obj Optional instance to populate.
     * @return {module:model/ControlLightResponse} The populated <code>ControlLightResponse</code> instance.
     */

  }, {
    key: "constructFromObject",
    value: function constructFromObject(data, obj) {
      if (data) {
        obj = obj || new ControlLightResponse();

        if (data.hasOwnProperty('success')) {
          obj['success'] = _ApiClient["default"].convertToType(data['success'], 'Boolean');
        }

        if (data.hasOwnProperty('time')) {
          obj['time'] = _ControlLightResponseTime["default"].constructFromObject(data['time']);
        }
      }

      return obj;
    }
  }]);

  return ControlLightResponse;
}();
/**
 * @member {Boolean} success
 */


ControlLightResponse.prototype['success'] = undefined;
/**
 * @member {module:model/ControlLightResponseTime} time
 */

ControlLightResponse.prototype['time'] = undefined;
var _default = ControlLightResponse;
exports["default"] = _default;