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
 * The ControlLightResponseTime model module.
 * @module model/ControlLightResponseTime
 * @version 1.0
 */
var ControlLightResponseTime = /*#__PURE__*/function () {
  /**
   * Constructs a new <code>ControlLightResponseTime</code>.
   * @alias module:model/ControlLightResponseTime
   */
  function ControlLightResponseTime() {
    _classCallCheck(this, ControlLightResponseTime);

    ControlLightResponseTime.initialize(this);
  }
  /**
   * Initializes the fields of this object.
   * This method is used by the constructors of any subclasses, in order to implement multiple inheritance (mix-ins).
   * Only for internal use.
   */


  _createClass(ControlLightResponseTime, null, [{
    key: "initialize",
    value: function initialize(obj) {}
    /**
     * Constructs a <code>ControlLightResponseTime</code> from a plain JavaScript object, optionally creating a new instance.
     * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
     * @param {Object} data The plain JavaScript object bearing properties of interest.
     * @param {module:model/ControlLightResponseTime} obj Optional instance to populate.
     * @return {module:model/ControlLightResponseTime} The populated <code>ControlLightResponseTime</code> instance.
     */

  }, {
    key: "constructFromObject",
    value: function constructFromObject(data, obj) {
      if (data) {
        obj = obj || new ControlLightResponseTime();

        if (data.hasOwnProperty('day')) {
          obj['day'] = _ApiClient["default"].convertToType(data['day'], 'String');
        }

        if (data.hasOwnProperty('month')) {
          obj['month'] = _ApiClient["default"].convertToType(data['month'], 'String');
        }

        if (data.hasOwnProperty('year')) {
          obj['year'] = _ApiClient["default"].convertToType(data['year'], 'String');
        }

        if (data.hasOwnProperty('hour')) {
          obj['hour'] = _ApiClient["default"].convertToType(data['hour'], 'String');
        }

        if (data.hasOwnProperty('minute')) {
          obj['minute'] = _ApiClient["default"].convertToType(data['minute'], 'String');
        }

        if (data.hasOwnProperty('second')) {
          obj['second'] = _ApiClient["default"].convertToType(data['second'], 'String');
        }
      }

      return obj;
    }
  }]);

  return ControlLightResponseTime;
}();
/**
 * @member {String} day
 */


ControlLightResponseTime.prototype['day'] = undefined;
/**
 * @member {String} month
 */

ControlLightResponseTime.prototype['month'] = undefined;
/**
 * @member {String} year
 */

ControlLightResponseTime.prototype['year'] = undefined;
/**
 * @member {String} hour
 */

ControlLightResponseTime.prototype['hour'] = undefined;
/**
 * @member {String} minute
 */

ControlLightResponseTime.prototype['minute'] = undefined;
/**
 * @member {String} second
 */

ControlLightResponseTime.prototype['second'] = undefined;
var _default = ControlLightResponseTime;
exports["default"] = _default;