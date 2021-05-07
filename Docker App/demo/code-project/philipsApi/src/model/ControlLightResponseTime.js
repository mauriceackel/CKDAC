/**
 * Phillips
 * No description provided (generated by Openapi Generator https://github.com/openapitools/openapi-generator)
 *
 * The version of the OpenAPI document: 1.0
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 *
 */

import ApiClient from '../ApiClient';

/**
 * The ControlLightResponseTime model module.
 * @module model/ControlLightResponseTime
 * @version 1.0
 */
class ControlLightResponseTime {
    /**
     * Constructs a new <code>ControlLightResponseTime</code>.
     * @alias module:model/ControlLightResponseTime
     */
    constructor() { 
        
        ControlLightResponseTime.initialize(this);
    }

    /**
     * Initializes the fields of this object.
     * This method is used by the constructors of any subclasses, in order to implement multiple inheritance (mix-ins).
     * Only for internal use.
     */
    static initialize(obj) { 
    }

    /**
     * Constructs a <code>ControlLightResponseTime</code> from a plain JavaScript object, optionally creating a new instance.
     * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
     * @param {Object} data The plain JavaScript object bearing properties of interest.
     * @param {module:model/ControlLightResponseTime} obj Optional instance to populate.
     * @return {module:model/ControlLightResponseTime} The populated <code>ControlLightResponseTime</code> instance.
     */
    static constructFromObject(data, obj) {
        if (data) {
            obj = obj || new ControlLightResponseTime();

            if (data.hasOwnProperty('day')) {
                obj['day'] = ApiClient.convertToType(data['day'], 'String');
            }
            if (data.hasOwnProperty('month')) {
                obj['month'] = ApiClient.convertToType(data['month'], 'String');
            }
            if (data.hasOwnProperty('year')) {
                obj['year'] = ApiClient.convertToType(data['year'], 'String');
            }
            if (data.hasOwnProperty('hour')) {
                obj['hour'] = ApiClient.convertToType(data['hour'], 'String');
            }
            if (data.hasOwnProperty('minute')) {
                obj['minute'] = ApiClient.convertToType(data['minute'], 'String');
            }
            if (data.hasOwnProperty('second')) {
                obj['second'] = ApiClient.convertToType(data['second'], 'String');
            }
        }
        return obj;
    }


}

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






export default ControlLightResponseTime;
