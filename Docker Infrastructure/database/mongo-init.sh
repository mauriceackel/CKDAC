#!/bin/bash
set -e

mongo <<EOF
use admin
db.auth('$MONGO_INITDB_ROOT_USERNAME', '$MONGO_INITDB_ROOT_PASSWORD');
use auth-service
db.createUser({
    user: '$AUTH_SERVICE_USER',
    pwd: '$AUTH_SERVICE_PW',
    roles: [
        { role: "readWrite", db: "auth-service" }
    ],
    mechanisms: [
        "SCRAM-SHA-1",
        "SCRAM-SHA-256"
    ],
});
EOF

#!/bin/bash
set -e

mongo <<EOF
use admin
db.auth('$MONGO_INITDB_ROOT_USERNAME', '$MONGO_INITDB_ROOT_PASSWORD');
use user-service
db.createUser({
    user: '$USER_SERVICE_USER',
    pwd: '$USER_SERVICE_PW',
    roles: [
        { role: "readWrite", db: "user-service" }
    ],
    mechanisms: [
        "SCRAM-SHA-1",
        "SCRAM-SHA-256"
    ],
});
EOF

#!/bin/bash
set -e

mongo <<EOF
use admin
db.auth('$MONGO_INITDB_ROOT_USERNAME', '$MONGO_INITDB_ROOT_PASSWORD');
use api-service
db.createUser({
    user: '$API_SERVICE_USER',
    pwd: '$API_SERVICE_PW',
    roles: [
        { role: "readWrite", db: "api-service" }
    ],
    mechanisms: [
        "SCRAM-SHA-1",
        "SCRAM-SHA-256"
    ],
});
EOF
    
#!/bin/bash
set -e

mongo <<EOF
use admin
db.auth('$MONGO_INITDB_ROOT_USERNAME', '$MONGO_INITDB_ROOT_PASSWORD');
use mapping-service
db.createUser({
    user: '$MAPPING_SERVICE_USER',
    pwd: '$MAPPING_SERVICE_PW',
    roles: [
        { role: "readWrite", db: "mapping-service" }
    ],
    mechanisms: [
        "SCRAM-SHA-1",
        "SCRAM-SHA-256"
    ],
});
EOF

#!/bin/bash
set -e

mongo <<EOF
use admin
db.auth('$MONGO_INITDB_ROOT_USERNAME', '$MONGO_INITDB_ROOT_PASSWORD');
use adapter-service
db.createUser({
    user: '$ADAPTER_SERVICE_USER',
    pwd: '$ADAPTER_SERVICE_PW',
    roles: [
        { role: "readWrite", db: "adapter-service" }
    ],
    mechanisms: [
        "SCRAM-SHA-1",
        "SCRAM-SHA-256"
    ],
});
EOF

#!/bin/bash
set -e

mongoimport --username=$MONGO_INITDB_ROOT_USERNAME --password=$MONGO_INITDB_ROOT_PASSWORD --authenticationDatabase=admin --db=api-service --collection=apis <<"APIS"
{"_id":{"$oid":"608944ab30f2120a8d92002d"},"name":"Philips Light","metadata":{"company":"Philips","keywords":"Light"},"apiSpec":"{\"openapi\":\"3.0.3\",\"info\":{\"title\":\"Phillips\",\"version\":\"1.0\",\"description\":\"\"},\"servers\":[{\"url\":\"http://iot.informatik.uni-mannheim.de:3008/api\",\"description\":\"\"}],\"paths\":{\"/state\":{\"post\":{\"description\":\"Set the state of a certain light bulb\",\"operationId\":\"controlLight\",\"requestBody\":{\"content\":{\"application/json\":{\"schema\":{\"$ref\":\"#/components/schemas/ControlLightRequest\"}}},\"required\":true},\"responses\":{\"200\":{\"description\":\"Light state was successfully set\",\"content\":{\"application/json\":{\"schema\":{\"$ref\":\"#/components/schemas/ControlLightResponse\"}}}},\"400\":{\"description\":\"Bad parameters passed\",\"content\":{\"application/json\":{\"schema\":{\"$ref\":\"#/components/schemas/BadRequestResponse\"}}}}}}}},\"components\":{\"schemas\":{\"ControlLightRequest\":{\"type\":\"object\",\"properties\":{\"deviceId\":{\"type\":\"string\"},\"power\":{\"type\":\"string\",\"enum\":[\"on\",\"off\"]},\"color\":{\"type\":\"string\",\"example\":\"#ff8800\"},\"brightness\":{\"type\":\"number\"}}},\"ControlLightResponse\":{\"type\":\"object\",\"properties\":{\"success\":{\"type\":\"boolean\"},\"time\":{\"type\":\"object\",\"properties\":{\"day\":{\"type\":\"string\"},\"month\":{\"type\":\"string\"},\"year\":{\"type\":\"string\"},\"hour\":{\"type\":\"string\"},\"minute\":{\"type\":\"string\"},\"second\":{\"type\":\"string\"}}}}},\"BadRequestResponse\":{\"type\":\"object\",\"properties\":{\"status\":{\"type\":\"string\"},\"message\":{\"type\":\"string\"}}}}}}","createdBy":"5dcad79be032c89c33eda9f4","type":0,"createdAt":{"$date":"2021-04-28T11:19:07.231Z"},"updatedAt":{"$date":"2021-04-28T13:49:33.65Z"},"__v":0}
{"_id":{"$oid":"608944c330f212676192002e"},"name":"Yeelight API","metadata":{"company":"Yeelight","keywords":"Light"},"apiSpec":"{\"openapi\":\"3.0.3\",\"info\":{\"title\":\"Yeelight\",\"version\":\"1.0\",\"description\":\"\"},\"servers\":[{\"url\":\"http://iot.informatik.uni-mannheim.de:3009\",\"description\":\"\"}],\"paths\":{\"/{lightId}/power\":{\"post\":{\"operationId\":\"setPower\",\"parameters\":[{\"name\":\"lightId\",\"in\":\"path\",\"required\":true,\"schema\":{\"type\":\"integer\"}}],\"requestBody\":{\"content\":{\"application/json\":{\"schema\":{\"$ref\":\"#/components/schemas/PowerRequest\"}}}},\"responses\":{\"200\":{\"description\":\"Power was set\",\"content\":{\"application/json\":{\"schema\":{\"$ref\":\"#/components/schemas/PowerResponse\"}}}},\"400\":{\"description\":\"Bad parameters passed\",\"content\":{\"application/json\":{\"schema\":{\"$ref\":\"#/components/schemas/BadRequestResponse\"}}}}}}},\"/{lightId}/color\":{\"post\":{\"operationId\":\"setColor\",\"parameters\":[{\"name\":\"lightId\",\"in\":\"path\",\"required\":true,\"schema\":{\"type\":\"integer\"}}],\"requestBody\":{\"content\":{\"application/json\":{\"schema\":{\"$ref\":\"#/components/schemas/ColorRequest\"}}}},\"responses\":{\"200\":{\"description\":\"Color was set\",\"content\":{\"application/json\":{\"schema\":{\"$ref\":\"#/components/schemas/ColorResponse\"}}}},\"400\":{\"description\":\"Bad parameters passed\",\"content\":{\"application/json\":{\"schema\":{\"$ref\":\"#/components/schemas/BadRequestResponse\"}}}}}}}},\"components\":{\"schemas\":{\"PowerRequest\":{\"type\":\"object\",\"properties\":{\"power\":{\"type\":\"string\",\"enum\":[\"on\",\"off\"]},\"brightness\":{\"type\":\"number\"}}},\"PowerResponse\":{\"type\":\"object\",\"properties\":{\"power\":{\"type\":\"string\",\"enum\":[\"on\",\"off\"]},\"brightness\":{\"type\":\"number\"},\"lightId\":{\"type\":\"string\"},\"timeDay\":{\"type\":\"string\"},\"timeMonth\":{\"type\":\"string\"},\"timeYear\":{\"type\":\"string\"},\"timeHour\":{\"type\":\"string\"},\"timeMinute\":{\"type\":\"string\"},\"timeSecond\":{\"type\":\"string\"}}},\"ColorRequest\":{\"type\":\"object\",\"properties\":{\"color\":{\"type\":\"string\",\"example\":\"#aa7700\"}}},\"ColorResponse\":{\"type\":\"object\",\"properties\":{\"color\":{\"type\":\"string\",\"example\":\"#aa7700\"},\"lightId\":{\"type\":\"string\"},\"timeDay\":{\"type\":\"string\"},\"timeMonth\":{\"type\":\"string\"},\"timeYear\":{\"type\":\"string\"},\"timeHour\":{\"type\":\"string\"},\"timeMinute\":{\"type\":\"string\"},\"timeSecond\":{\"type\":\"string\"}}},\"BadRequestResponse\":{\"type\":\"object\",\"properties\":{\"error\":{\"type\":\"string\"}}}}}}","createdBy":"5dcad79be032c89c33eda9f4","type":0,"createdAt":{"$date":"2021-04-28T11:19:31.412Z"},"updatedAt":{"$date":"2021-04-28T11:22:36.085Z"},"__v":0}
APIS

mongoimport --username=$MONGO_INITDB_ROOT_USERNAME --password=$MONGO_INITDB_ROOT_PASSWORD --authenticationDatabase=admin --db=mapping-service --collection=mappings <<"MAPPINGS"
{"_id":{"$oid":"6089461585bb513d2d20a9df"},"targetIds":["608944c330f212676192002e_setPower_200"],"__t":"OpenApiMapping","apiType":0,"type":0,"createdBy":"5dcad79be032c89c33eda9f4","sourceId":"608944ab30f2120a8d92002d_controlLight_200","requestMapping":"{\"608944c330f212676192002e_setPower_200\":{\"parameters\":{\"lightId\":\"$.\\\"608944ab30f2120a8d92002d_controlLight_200\\\".\\\"body\\\".\\\"deviceId\\\"\"},\"body\":{\"power\":\"$.\\\"608944ab30f2120a8d92002d_controlLight_200\\\".\\\"body\\\".\\\"power\\\"\"}}}","responseMapping":"{\"608944ab30f2120a8d92002d_controlLight_200\":{\"time\":{\"day\":\"$.\\\"608944c330f212676192002e_setPower_200\\\".\\\"timeDay\\\"\",\"month\":\"$.\\\"608944c330f212676192002e_setPower_200\\\".\\\"timeMonth\\\"\",\"year\":\"$.\\\"608944c330f212676192002e_setPower_200\\\".\\\"timeYear\\\"\",\"hour\":\"$.\\\"608944c330f212676192002e_setPower_200\\\".\\\"timeHour\\\"\",\"minute\":\"$.\\\"608944c330f212676192002e_setPower_200\\\".\\\"timeMinute\\\"\",\"second\":\"$.\\\"608944c330f212676192002e_setPower_200\\\".\\\"timeSecond\\\"\"},\"success\":\"true\"}}","checksum":"4d7a5ccd384a67ac747cbccd6ce32621a7877773","createdAt":{"$date":"2021-04-28T11:25:09.25Z"},"updatedAt":{"$date":"2021-04-28T11:25:09.25Z"},"__v":0}
{"_id":{"$oid":"6089461585bb519d8620a9e0"},"targetIds":["608944ab30f2120a8d92002d_controlLight_200"],"__t":"OpenApiMapping","apiType":0,"sourceId":"608944c330f212676192002e_setPower_200","createdBy":"5dcad79be032c89c33eda9f4","type":2,"requestMapping":"{\"608944ab30f2120a8d92002d_controlLight_200\":{\"body\":{\"deviceId\":\"$.\\\"608944c330f212676192002e_setPower_200\\\".\\\"parameters\\\".\\\"lightId\\\"\",\"power\":\"$.\\\"608944c330f212676192002e_setPower_200\\\".\\\"body\\\".\\\"power\\\"\",\"brightness\":\"$.\\\"608944c330f212676192002e_setPower_200\\\".\\\"body\\\".\\\"brightness\\\"\"}}}","responseMapping":"{\"608944c330f212676192002e_setPower_200\":{\"timeDay\":\"$.\\\"608944ab30f2120a8d92002d_controlLight_200\\\".\\\"time\\\".\\\"day\\\"\",\"timeMonth\":\"$.\\\"608944ab30f2120a8d92002d_controlLight_200\\\".\\\"time\\\".\\\"month\\\"\",\"timeYear\":\"$.\\\"608944ab30f2120a8d92002d_controlLight_200\\\".\\\"time\\\".\\\"year\\\"\",\"timeHour\":\"$.\\\"608944ab30f2120a8d92002d_controlLight_200\\\".\\\"time\\\".\\\"hour\\\"\",\"timeMinute\":\"$.\\\"608944ab30f2120a8d92002d_controlLight_200\\\".\\\"time\\\".\\\"minute\\\"\",\"timeSecond\":\"$.\\\"608944ab30f2120a8d92002d_controlLight_200\\\".\\\"time\\\".\\\"second\\\"\"}}","checksum":"aad38ecb1915d24334149ffdef2cb54485944a80","createdAt":{"$date":"2021-04-28T11:25:09.279Z"},"updatedAt":{"$date":"2021-04-28T11:25:09.279Z"},"__v":0}
{"_id":{"$oid":"6089463b85bb51470120aa05"},"targetIds":["608944c330f212676192002e_setColor_200"],"__t":"OpenApiMapping","apiType":0,"type":0,"createdBy":"5dcad79be032c89c33eda9f4","sourceId":"608944ab30f2120a8d92002d_controlLight_200","requestMapping":"{\"608944c330f212676192002e_setColor_200\":{\"body\":{\"color\":\"$.\\\"608944ab30f2120a8d92002d_controlLight_200\\\".\\\"body\\\".\\\"color\\\"\"}}}","responseMapping":"{\"608944ab30f2120a8d92002d_controlLight_200\":{\"time\":{\"day\":\"$.\\\"608944c330f212676192002e_setColor_200\\\".\\\"timeDay\\\"\",\"month\":\"$.\\\"608944c330f212676192002e_setColor_200\\\".\\\"timeMonth\\\"\",\"year\":\"$.\\\"608944c330f212676192002e_setColor_200\\\".\\\"timeYear\\\"\",\"hour\":\"$.\\\"608944c330f212676192002e_setColor_200\\\".\\\"timeHour\\\"\",\"minute\":\"$.\\\"608944c330f212676192002e_setColor_200\\\".\\\"timeMinute\\\"\",\"second\":\"$.\\\"608944c330f212676192002e_setColor_200\\\".\\\"timeSecond\\\"\"},\"success\":\"true\"}}","checksum":"9248363d5fcc0bbebb4e4f415e6fe3994c6bb146","createdAt":{"$date":"2021-04-28T11:25:47.798Z"},"updatedAt":{"$date":"2021-04-28T11:25:47.798Z"},"__v":0}
{"_id":{"$oid":"6089463b85bb51a65b20aa06"},"targetIds":["608944ab30f2120a8d92002d_controlLight_200"],"__t":"OpenApiMapping","apiType":0,"sourceId":"608944c330f212676192002e_setColor_200","createdBy":"5dcad79be032c89c33eda9f4","type":2,"requestMapping":"{\"608944ab30f2120a8d92002d_controlLight_200\":{\"body\":{\"deviceId\":\"$.\\\"608944c330f212676192002e_setColor_200\\\".\\\"parameters\\\".\\\"lightId\\\"\",\"color\":\"$.\\\"608944c330f212676192002e_setColor_200\\\".\\\"body\\\".\\\"color\\\"\"}}}","responseMapping":"{\"608944c330f212676192002e_setColor_200\":{\"timeDay\":\"$.\\\"608944ab30f2120a8d92002d_controlLight_200\\\".\\\"time\\\".\\\"day\\\"\",\"timeMonth\":\"$.\\\"608944ab30f2120a8d92002d_controlLight_200\\\".\\\"time\\\".\\\"month\\\"\",\"timeYear\":\"$.\\\"608944ab30f2120a8d92002d_controlLight_200\\\".\\\"time\\\".\\\"year\\\"\",\"timeHour\":\"$.\\\"608944ab30f2120a8d92002d_controlLight_200\\\".\\\"time\\\".\\\"hour\\\"\",\"timeMinute\":\"$.\\\"608944ab30f2120a8d92002d_controlLight_200\\\".\\\"time\\\".\\\"minute\\\"\",\"timeSecond\":\"$.\\\"608944ab30f2120a8d92002d_controlLight_200\\\".\\\"time\\\".\\\"second\\\"\"}}","checksum":"e6877a99eab35742448d196aab8fa4d2b8d5e98a","createdAt":{"$date":"2021-04-28T11:25:47.806Z"},"updatedAt":{"$date":"2021-04-28T11:25:47.806Z"},"__v":0}
MAPPINGS

mongoimport --username=$MONGO_INITDB_ROOT_USERNAME --password=$MONGO_INITDB_ROOT_PASSWORD --authenticationDatabase=admin --db=mapping-service --collection=attributenodes <<"ATTRIBUTENODES"
{"_id":{"$oid":"6089461585bb516feb20a9e5"},"component":["608944c330f212676192002e_setColor_200.timeYear","608944ab30f2120a8d92002d_controlLight_200.time.year","608944c330f212676192002e_setPower_200.timeYear"],"attributeId":"608944c330f212676192002e_setPower_200.timeYear","edges":[{"_id":{"$oid":"6089461585bb51da5d20a9e6"},"source":"608944c330f212676192002e_setPower_200.timeYear","target":"608944ab30f2120a8d92002d_controlLight_200.time.year","transformation":"$.\"608944c330f212676192002e_setPower_200\".\"timeYear\""}],"__v":0}
{"_id":{"$oid":"6089461585bb5172d020a9ef"},"component":["608944c330f212676192002e_setColor_200.timeHour","608944ab30f2120a8d92002d_controlLight_200.time.hour","608944c330f212676192002e_setPower_200.timeHour"],"attributeId":"608944c330f212676192002e_setPower_200.timeHour","edges":[{"_id":{"$oid":"6089461585bb51a0e120a9f0"},"source":"608944c330f212676192002e_setPower_200.timeHour","target":"608944ab30f2120a8d92002d_controlLight_200.time.hour","transformation":"$.\"608944c330f212676192002e_setPower_200\".\"timeHour\""}],"__v":0}
{"_id":{"$oid":"6089461585bb51fd8c20a9f5"},"component":["608944c330f212676192002e_setColor_200.timeHour","608944ab30f2120a8d92002d_controlLight_200.time.hour","608944c330f212676192002e_setPower_200.timeHour"],"attributeId":"608944ab30f2120a8d92002d_controlLight_200.time.hour","edges":[{"_id":{"$oid":"6089461585bb511a4c20a9f6"},"source":"608944ab30f2120a8d92002d_controlLight_200.time.hour","target":"608944c330f212676192002e_setPower_200.timeHour","transformation":"$.\"608944ab30f2120a8d92002d_controlLight_200\".\"time\".\"hour\""},{"_id":{"$oid":"6089463b85bb516f0220aa1c"},"source":"608944ab30f2120a8d92002d_controlLight_200.time.hour","target":"608944c330f212676192002e_setColor_200.timeHour","transformation":"$.\"608944ab30f2120a8d92002d_controlLight_200\".\"time\".\"hour\""}],"__v":0}
{"_id":{"$oid":"6089461585bb515c8420a9e3"},"component":["608944ab30f2120a8d92002d_controlLight_200.body.power","608944c330f212676192002e_setPower_200.body.power"],"attributeId":"608944ab30f2120a8d92002d_controlLight_200.body.power","edges":[{"_id":{"$oid":"6089461585bb5143ce20a9e4"},"source":"608944ab30f2120a8d92002d_controlLight_200.body.power","target":"608944c330f212676192002e_setPower_200.body.power","transformation":"$.\"608944ab30f2120a8d92002d_controlLight_200\".\"body\".\"power\""}],"__v":0}
{"_id":{"$oid":"6089461585bb51cbb620a9f1"},"component":["608944c330f212676192002e_setColor_200.timeSecond","608944ab30f2120a8d92002d_controlLight_200.time.second","608944c330f212676192002e_setPower_200.timeSecond"],"attributeId":"608944c330f212676192002e_setPower_200.timeSecond","edges":[{"_id":{"$oid":"6089461585bb5131d320a9f2"},"source":"608944c330f212676192002e_setPower_200.timeSecond","target":"608944ab30f2120a8d92002d_controlLight_200.time.second","transformation":"$.\"608944c330f212676192002e_setPower_200\".\"timeSecond\""}],"__v":0}
{"_id":{"$oid":"6089461585bb51bd4020a9e7"},"component":["608944ab30f2120a8d92002d_controlLight_200.body.deviceId","608944c330f212676192002e_setColor_200.parameters.lightId","608944c330f212676192002e_setPower_200.parameters.lightId"],"attributeId":"608944ab30f2120a8d92002d_controlLight_200.body.deviceId","edges":[{"_id":{"$oid":"6089461585bb5148ee20a9e8"},"source":"608944ab30f2120a8d92002d_controlLight_200.body.deviceId","target":"608944c330f212676192002e_setPower_200.parameters.lightId","transformation":"$.\"608944ab30f2120a8d92002d_controlLight_200\".\"body\".\"deviceId\""},{"_id":{"$oid":"6089463b85bb51178620aa0c"},"source":"608944ab30f2120a8d92002d_controlLight_200.body.deviceId","target":"608944c330f212676192002e_setColor_200.parameters.lightId","transformation":"$.\"608944ab30f2120a8d92002d_controlLight_200\".\"body\".\"deviceId\""}],"__v":0}
{"_id":{"$oid":"6089461585bb51740d20a9f3"},"component":["608944c330f212676192002e_setColor_200.timeYear","608944ab30f2120a8d92002d_controlLight_200.time.year","608944c330f212676192002e_setPower_200.timeYear"],"attributeId":"608944ab30f2120a8d92002d_controlLight_200.time.year","edges":[{"_id":{"$oid":"6089461585bb51b5ec20a9f4"},"source":"608944ab30f2120a8d92002d_controlLight_200.time.year","target":"608944c330f212676192002e_setPower_200.timeYear","transformation":"$.\"608944ab30f2120a8d92002d_controlLight_200\".\"time\".\"year\""},{"_id":{"$oid":"6089463b85bb51951420aa18"},"source":"608944ab30f2120a8d92002d_controlLight_200.time.year","target":"608944c330f212676192002e_setColor_200.timeYear","transformation":"$.\"608944ab30f2120a8d92002d_controlLight_200\".\"time\".\"year\""}],"__v":0}
{"_id":{"$oid":"6089461585bb514fec20a9f7"},"component":["608944ab30f2120a8d92002d_controlLight_200.body.power","608944c330f212676192002e_setPower_200.body.power"],"attributeId":"608944c330f212676192002e_setPower_200.body.power","edges":[{"_id":{"$oid":"6089461585bb51c03920a9f8"},"source":"608944c330f212676192002e_setPower_200.body.power","target":"608944ab30f2120a8d92002d_controlLight_200.body.power","transformation":"$.\"608944c330f212676192002e_setPower_200\".\"body\".\"power\""}],"__v":0}
{"_id":{"$oid":"6089461585bb51a67720a9e9"},"component":["608944c330f212676192002e_setColor_200.timeMonth","608944ab30f2120a8d92002d_controlLight_200.time.month","608944c330f212676192002e_setPower_200.timeMonth"],"attributeId":"608944c330f212676192002e_setPower_200.timeMonth","edges":[{"_id":{"$oid":"6089461585bb51e19420a9ea"},"source":"608944c330f212676192002e_setPower_200.timeMonth","target":"608944ab30f2120a8d92002d_controlLight_200.time.month","transformation":"$.\"608944c330f212676192002e_setPower_200\".\"timeMonth\""}],"__v":0}
{"_id":{"$oid":"6089461585bb51d36b20a9ed"},"component":["608944c330f212676192002e_setColor_200.timeDay","608944ab30f2120a8d92002d_controlLight_200.time.day","608944c330f212676192002e_setPower_200.timeDay"],"attributeId":"608944c330f212676192002e_setPower_200.timeDay","edges":[{"_id":{"$oid":"6089461585bb517b0420a9ee"},"source":"608944c330f212676192002e_setPower_200.timeDay","target":"608944ab30f2120a8d92002d_controlLight_200.time.day","transformation":"$.\"608944c330f212676192002e_setPower_200\".\"timeDay\""}],"__v":0}
{"_id":{"$oid":"6089461585bb514e9f20a9e1"},"component":["608944c330f212676192002e_setColor_200.timeMinute","608944ab30f2120a8d92002d_controlLight_200.time.minute","608944c330f212676192002e_setPower_200.timeMinute"],"attributeId":"608944c330f212676192002e_setPower_200.timeMinute","edges":[{"_id":{"$oid":"6089461585bb51e59920a9e2"},"source":"608944c330f212676192002e_setPower_200.timeMinute","target":"608944ab30f2120a8d92002d_controlLight_200.time.minute","transformation":"$.\"608944c330f212676192002e_setPower_200\".\"timeMinute\""}],"__v":0}
{"_id":{"$oid":"6089461585bb51b3aa20a9f9"},"component":["608944c330f212676192002e_setColor_200.timeSecond","608944ab30f2120a8d92002d_controlLight_200.time.second","608944c330f212676192002e_setPower_200.timeSecond"],"attributeId":"608944ab30f2120a8d92002d_controlLight_200.time.second","edges":[{"_id":{"$oid":"6089461585bb51c17620a9fa"},"source":"608944ab30f2120a8d92002d_controlLight_200.time.second","target":"608944c330f212676192002e_setPower_200.timeSecond","transformation":"$.\"608944ab30f2120a8d92002d_controlLight_200\".\"time\".\"second\""},{"_id":{"$oid":"6089463b85bb51ab6f20aa26"},"source":"608944ab30f2120a8d92002d_controlLight_200.time.second","target":"608944c330f212676192002e_setColor_200.timeSecond","transformation":"$.\"608944ab30f2120a8d92002d_controlLight_200\".\"time\".\"second\""}],"__v":0}
{"_id":{"$oid":"6089461585bb51fbbd20a9fb"},"component":["608944ab30f2120a8d92002d_controlLight_200.body.deviceId","608944c330f212676192002e_setColor_200.parameters.lightId","608944c330f212676192002e_setPower_200.parameters.lightId"],"attributeId":"608944c330f212676192002e_setPower_200.parameters.lightId","edges":[{"_id":{"$oid":"6089461585bb518bdc20a9fc"},"source":"608944c330f212676192002e_setPower_200.parameters.lightId","target":"608944ab30f2120a8d92002d_controlLight_200.body.deviceId","transformation":"$.\"608944c330f212676192002e_setPower_200\".\"parameters\".\"lightId\""}],"__v":0}
{"_id":{"$oid":"6089461585bb51c99320a9fd"},"component":["608944c330f212676192002e_setColor_200.timeMonth","608944ab30f2120a8d92002d_controlLight_200.time.month","608944c330f212676192002e_setPower_200.timeMonth"],"attributeId":"608944ab30f2120a8d92002d_controlLight_200.time.month","edges":[{"_id":{"$oid":"6089461585bb51d9e020a9fe"},"source":"608944ab30f2120a8d92002d_controlLight_200.time.month","target":"608944c330f212676192002e_setPower_200.timeMonth","transformation":"$.\"608944ab30f2120a8d92002d_controlLight_200\".\"time\".\"month\""},{"_id":{"$oid":"6089463b85bb51332020aa1e"},"source":"608944ab30f2120a8d92002d_controlLight_200.time.month","target":"608944c330f212676192002e_setColor_200.timeMonth","transformation":"$.\"608944ab30f2120a8d92002d_controlLight_200\".\"time\".\"month\""}],"__v":0}
{"_id":{"$oid":"6089461585bb51529b20a9ff"},"component":["608944c330f212676192002e_setColor_200.timeDay","608944ab30f2120a8d92002d_controlLight_200.time.day","608944c330f212676192002e_setPower_200.timeDay"],"attributeId":"608944ab30f2120a8d92002d_controlLight_200.time.day","edges":[{"_id":{"$oid":"6089461585bb5144d720aa00"},"source":"608944ab30f2120a8d92002d_controlLight_200.time.day","target":"608944c330f212676192002e_setPower_200.timeDay","transformation":"$.\"608944ab30f2120a8d92002d_controlLight_200\".\"time\".\"day\""},{"_id":{"$oid":"6089463b85bb51859920aa16"},"source":"608944ab30f2120a8d92002d_controlLight_200.time.day","target":"608944c330f212676192002e_setColor_200.timeDay","transformation":"$.\"608944ab30f2120a8d92002d_controlLight_200\".\"time\".\"day\""}],"__v":0}
{"_id":{"$oid":"6089461585bb51141b20aa01"},"component":["608944c330f212676192002e_setColor_200.timeMinute","608944ab30f2120a8d92002d_controlLight_200.time.minute","608944c330f212676192002e_setPower_200.timeMinute"],"attributeId":"608944ab30f2120a8d92002d_controlLight_200.time.minute","edges":[{"_id":{"$oid":"6089461585bb51616b20aa02"},"source":"608944ab30f2120a8d92002d_controlLight_200.time.minute","target":"608944c330f212676192002e_setPower_200.timeMinute","transformation":"$.\"608944ab30f2120a8d92002d_controlLight_200\".\"time\".\"minute\""},{"_id":{"$oid":"6089463b85bb51177820aa20"},"source":"608944ab30f2120a8d92002d_controlLight_200.time.minute","target":"608944c330f212676192002e_setColor_200.timeMinute","transformation":"$.\"608944ab30f2120a8d92002d_controlLight_200\".\"time\".\"minute\""}],"__v":0}
{"_id":{"$oid":"6089463b85bb5146f620aa07"},"component":["608944c330f212676192002e_setColor_200.timeDay","608944ab30f2120a8d92002d_controlLight_200.time.day","608944c330f212676192002e_setPower_200.timeDay"],"attributeId":"608944c330f212676192002e_setColor_200.timeDay","edges":[{"_id":{"$oid":"6089463b85bb51ddf620aa08"},"source":"608944c330f212676192002e_setColor_200.timeDay","target":"608944ab30f2120a8d92002d_controlLight_200.time.day","transformation":"$.\"608944c330f212676192002e_setColor_200\".\"timeDay\""}],"__v":0}
{"_id":{"$oid":"6089463b85bb5176e020aa09"},"component":["608944c330f212676192002e_setColor_200.timeHour","608944ab30f2120a8d92002d_controlLight_200.time.hour","608944c330f212676192002e_setPower_200.timeHour"],"attributeId":"608944c330f212676192002e_setColor_200.timeHour","edges":[{"_id":{"$oid":"6089463b85bb511cf320aa0a"},"source":"608944c330f212676192002e_setColor_200.timeHour","target":"608944ab30f2120a8d92002d_controlLight_200.time.hour","transformation":"$.\"608944c330f212676192002e_setColor_200\".\"timeHour\""}],"__v":0}
{"_id":{"$oid":"6089463b85bb51e22f20aa0d"},"component":["608944c330f212676192002e_setColor_200.timeMonth","608944ab30f2120a8d92002d_controlLight_200.time.month","608944c330f212676192002e_setPower_200.timeMonth"],"attributeId":"608944c330f212676192002e_setColor_200.timeMonth","edges":[{"_id":{"$oid":"6089463b85bb5103ce20aa0e"},"source":"608944c330f212676192002e_setColor_200.timeMonth","target":"608944ab30f2120a8d92002d_controlLight_200.time.month","transformation":"$.\"608944c330f212676192002e_setColor_200\".\"timeMonth\""}],"__v":0}
{"_id":{"$oid":"6089463b85bb51a3ef20aa0f"},"component":["608944ab30f2120a8d92002d_controlLight_200.body.color","608944c330f212676192002e_setColor_200.body.color"],"attributeId":"608944ab30f2120a8d92002d_controlLight_200.body.color","edges":[{"_id":{"$oid":"6089463b85bb51043c20aa10"},"source":"608944ab30f2120a8d92002d_controlLight_200.body.color","target":"608944c330f212676192002e_setColor_200.body.color","transformation":"$.\"608944ab30f2120a8d92002d_controlLight_200\".\"body\".\"color\""}],"__v":0}
{"_id":{"$oid":"6089463b85bb51252920aa11"},"component":["608944c330f212676192002e_setColor_200.timeYear","608944ab30f2120a8d92002d_controlLight_200.time.year","608944c330f212676192002e_setPower_200.timeYear"],"attributeId":"608944c330f212676192002e_setColor_200.timeYear","edges":[{"_id":{"$oid":"6089463b85bb51c72220aa12"},"source":"608944c330f212676192002e_setColor_200.timeYear","target":"608944ab30f2120a8d92002d_controlLight_200.time.year","transformation":"$.\"608944c330f212676192002e_setColor_200\".\"timeYear\""}],"__v":0}
{"_id":{"$oid":"6089463b85bb512abf20aa13"},"component":["608944c330f212676192002e_setColor_200.timeMinute","608944ab30f2120a8d92002d_controlLight_200.time.minute","608944c330f212676192002e_setPower_200.timeMinute"],"attributeId":"608944c330f212676192002e_setColor_200.timeMinute","edges":[{"_id":{"$oid":"6089463b85bb5174b020aa14"},"source":"608944c330f212676192002e_setColor_200.timeMinute","target":"608944ab30f2120a8d92002d_controlLight_200.time.minute","transformation":"$.\"608944c330f212676192002e_setColor_200\".\"timeMinute\""}],"__v":0}
{"_id":{"$oid":"6089463b85bb51a5ca20aa19"},"component":["608944ab30f2120a8d92002d_controlLight_200.body.color","608944c330f212676192002e_setColor_200.body.color"],"attributeId":"608944c330f212676192002e_setColor_200.body.color","edges":[{"_id":{"$oid":"6089463b85bb51597d20aa1a"},"source":"608944c330f212676192002e_setColor_200.body.color","target":"608944ab30f2120a8d92002d_controlLight_200.body.color","transformation":"$.\"608944c330f212676192002e_setColor_200\".\"body\".\"color\""}],"__v":0}
{"_id":{"$oid":"6089463b85bb51d53620aa21"},"component":["608944ab30f2120a8d92002d_controlLight_200.body.deviceId","608944c330f212676192002e_setColor_200.parameters.lightId","608944c330f212676192002e_setPower_200.parameters.lightId"],"attributeId":"608944c330f212676192002e_setColor_200.parameters.lightId","edges":[{"_id":{"$oid":"6089463b85bb51542a20aa22"},"source":"608944c330f212676192002e_setColor_200.parameters.lightId","target":"608944ab30f2120a8d92002d_controlLight_200.body.deviceId","transformation":"$.\"608944c330f212676192002e_setColor_200\".\"parameters\".\"lightId\""}],"__v":0}
{"_id":{"$oid":"6089463b85bb51574820aa23"},"component":["608944c330f212676192002e_setColor_200.timeSecond","608944ab30f2120a8d92002d_controlLight_200.time.second","608944c330f212676192002e_setPower_200.timeSecond"],"attributeId":"608944c330f212676192002e_setColor_200.timeSecond","edges":[{"_id":{"$oid":"6089463b85bb516ae320aa24"},"source":"608944c330f212676192002e_setColor_200.timeSecond","target":"608944ab30f2120a8d92002d_controlLight_200.time.second","transformation":"$.\"608944c330f212676192002e_setColor_200\".\"timeSecond\""}],"__v":0}
ATTRIBUTENODES

mongoimport --username=$MONGO_INITDB_ROOT_USERNAME --password=$MONGO_INITDB_ROOT_PASSWORD --authenticationDatabase=admin --db=auth-service --collection=activities <<"ACTIVITIES"
{"_id":{"$oid":"5dcad79be032c89c33eda9fd"},"name":"god","method":"*","url":"^.*$"}
{"_id":{"$oid":"5e14c65d6ed91211d6b53f17"},"name":"getUser","method":"GET","url":"^.*/users/[^/]+/?$"}
{"_id":{"$oid":"5e14c7066ed91211d6b540d9"},"name":"listUsers","method":"GET","url":"^.*/users/?(\\?([^=\u0026]+?=[^=\u0026]+?)(\u0026[^=\u0026]+?=[^=\u0026]+?)*)?$"}
{"_id":{"$oid":"5e14c7416ed91211d6b5417f"},"name":"createUser","method":"POST","url":"^.*/users/?$"}
{"_id":{"$oid":"5e14c7696ed91211d6b541fd"},"name":"updateUser","method":"PUT","url":"^.*/users/[^/]+/?$"}
{"_id":{"$oid":"5e14c7b76ed91211d6b542c6"},"name":"deleteUser","method":"DELETE","url":"^.*/users/[^/]+/?$"}
{"_id":{"$oid":"5e14ca606ed91211d6b54a87"},"name":"getApi","method":"GET","url":"^.*/apis/[^/]+/?$"}
{"_id":{"$oid":"5e14caca6ed91211d6b54b98"},"name":"listApis","method":"GET","url":"^.*/apis/?(\\?([^=\u0026]+?=[^=\u0026]+?)(\u0026[^=\u0026]+?=[^=\u0026]+?)*)?$"}
{"_id":{"$oid":"5e14cb326ed91211d6b54cdd"},"name":"createApi","method":"POST","url":"^.*/apis/?$"}
{"_id":{"$oid":"5e14cb576ed91211d6b54d59"},"name":"updateApi","method":"PUT","url":"^.*/apis/[^/]+/?$"}
{"_id":{"$oid":"5e14cbb46ed91211d6b54e37"},"name":"deleteApi","method":"DELETE","url":"^.*/apis/[^/]+/?$"}
{"_id":{"$oid":"5e14cf5f9db771209adf8308"},"name":"getMapping","method":"GET","url":"^.*/mappings/(?!generate(/|$))[^/]+/?$"}
{"_id":{"$oid":"5e14cfab9db771209adf830b"},"name":"listMappings","method":"GET","url":"^.*/mappings/?(\\?([^=\u0026]+?=[^=\u0026]+?)(\u0026[^=\u0026]+?=[^=\u0026]+?)*)?$"}
{"_id":{"$oid":"5e14cfdb9db771209adf830e"},"name":"createMapping","method":"POST","url":"^.*/mappings/?$"}
{"_id":{"$oid":"5e14cfe59db771209adf830f"},"name":"updateMapping","method":"PUT","url":"^.*/mappings/(?!generate(/|$))[^/]+/?$"}
{"_id":{"$oid":"5e14cffe9db771209adf8311"},"name":"deleteMapping","method":"DELETE","url":"^.*/mappings/(?!generate(/|$))[^/]+/?$"}
{"_id":{"$oid":"5e14cffe9db771209adf8312"},"name":"generateMapping","method":"POST","url":"^.*/mappings/generate/?$"}
{"_id":{"$oid":"5e14cffe9db771209adf8316"},"name":"generateAttributeMapping","method":"POST","url":"^.*/mappings/generate/attribute?$"}
{"_id":{"$oid":"5e14cffe9db771209adf8315"},"name":"getMappedOperations","method":"POST","url":"^.*/mappings/mapped-operations/?$"}
{"_id":{"$oid":"5e14d2219db771209adf8313"},"name":"createAdapter","method":"POST","url":"^.*/adapters/generate/[^/]+/?$"}
{"_id":{"$oid":"5e14d2219db771209adf8314"},"name":"downloadAdapter","method":"GET","url":"^.*/adapters/download/[^/]+/?$"}
ACTIVITIES

mongoimport --username=$MONGO_INITDB_ROOT_USERNAME --password=$MONGO_INITDB_ROOT_PASSWORD --authenticationDatabase=admin --db=auth-service --collection=permissions <<"PERMISSIONS"
{"_id":{"$oid":"5dcad79be032c89c33eda9fe"},"name":"god","activities":[{"$oid":"5dcad79be032c89c33eda9fd"}]}
{"_id":{"$oid":"5e14c8826ed91211d6b54518"},"name":"manageUser","activities":[{"$oid":"5e14c65d6ed91211d6b53f17"},{"$oid":"5e14c7696ed91211d6b541fd"},{"$oid":"5e14c7b76ed91211d6b542c6"}]}
{"_id":{"$oid":"5e14d15c6ed91211d6b55de3"},"name":"getUser","activities":[{"$oid":"5e14c65d6ed91211d6b53f17"}]}
{"_id":{"$oid":"5e14c89c6ed91211d6b54550"},"name":"listUsers","activities":[{"$oid":"5e14c7066ed91211d6b540d9"}]}
{"_id":{"$oid":"5e14c89c6ed91211d6b54551"},"name":"createUser","activities":[{"$oid":"5e14c7416ed91211d6b5417f"}]}
{"_id":{"$oid":"5e14cc236ed91211d6b54f78"},"name":"manageApi","activities":[{"$oid":"5e14ca606ed91211d6b54a87"},{"$oid":"5e14cb576ed91211d6b54d59"},{"$oid":"5e14cbb46ed91211d6b54e37"}]}
{"_id":{"$oid":"5e14cca76ed91211d6b550cf"},"name":"getApi","activities":[{"$oid":"5e14ca606ed91211d6b54a87"}]}
{"_id":{"$oid":"5e14d2d26ed91211d6b56246"},"name":"listApis","activities":[{"$oid":"5e14caca6ed91211d6b54b98"}]}
{"_id":{"$oid":"5e14c89c6ed91211d6b54552"},"name":"createApi","activities":[{"$oid":"5e14cb326ed91211d6b54cdd"}]}
{"_id":{"$oid":"5e14d0e76ed91211d6b55cb6"},"name":"manageMapping","activities":[{"$oid":"5e14cf5f9db771209adf8308"},{"$oid":"5e14cfe59db771209adf830f"},{"$oid":"5e14cffe9db771209adf8311"}]}
{"_id":{"$oid":"5e14d0ff6ed91211d6b55cfc"},"name":"generateMapping","activities":[{"$oid":"5e14cffe9db771209adf8312"},{"$oid":"5e14cffe9db771209adf8316"}]}
{"_id":{"$oid":"5e14cd276ed91211d6b5523b"},"name":"createMapping","activities":[{"$oid":"5e14cfdb9db771209adf830e"}]}
{"_id":{"$oid":"5e14cd916ed91211d6b55351"},"name":"getMapping","activities":[{"$oid":"5e14cf5f9db771209adf8308"}]}
{"_id":{"$oid":"5e14cd916ed91211d6b55352"},"name":"listMappings","activities":[{"$oid":"5e14cfab9db771209adf830b"},{"$oid":"5e14cffe9db771209adf8315"}]}
{"_id":{"$oid":"5e14d1776ed91211d6b55e4c"},"name":"createAdapter","activities":[{"$oid":"5e14d2219db771209adf8313"},{"$oid":"5e14d2219db771209adf8314"}]}
PERMISSIONS

mongoimport --username=$MONGO_INITDB_ROOT_USERNAME --password=$MONGO_INITDB_ROOT_PASSWORD --authenticationDatabase=admin --db=user-service --collection=users <<"USERS"
{"_id":{"$oid":"5dcad79be032c89c33eda9f4"},"password":"9e610c1690d0d556d36b990cf46e647f064789e9aa6699fd15978e34417518b0bca420d6fb6682da26ba51dae25bc69b57a6fede3e4fecaa8ec8cb48648db5dc/e2a741daa9c94fa0c94669b37a15099d","email":"root@example.com","firstname":"Root","lastname":"User","type":0}
{"_id":{"$oid":"60911c69b3f822aedb7474f1"},"firstname":"Alice","lastname":"Integrator","email":"alice@example.com","password":"412c8877d69d179d35f863ec83ec310359cf80975959e47fbe37b8ad1f3609adfbde4742f623d5b724e6d7d7f36fe663ebc02cbc359662540240235d18e68305/da0afb60d134555b3777d6740798e803","type":0,"createdAt":{"$date":"2021-05-04T10:05:29.676Z"},"updatedAt":{"$date":"2021-05-04T10:05:29.676Z"},"__v":0}
{"_id":{"$oid":"60911c81b3f8221bad7474f2"},"firstname":"Bob","lastname":"Developer","email":"bob@example.com","password":"0898dc59935813bec5334607f33de02375bfad3153261f1e442eda23b2c2cd1455c7ed7b1f8b17c3a453b87b28ffea088df10e6f5dfecc847f6732008791c76e/1aa7e4fd420b57da801354eebfcc33ad","type":0,"createdAt":{"$date":"2021-05-04T10:05:53.513Z"},"updatedAt":{"$date":"2021-05-04T10:05:53.513Z"},"__v":0}
USERS

mongoimport --username=$MONGO_INITDB_ROOT_USERNAME --password=$MONGO_INITDB_ROOT_PASSWORD --authenticationDatabase=admin --db=auth-service --collection=roles <<"ROLES"
{"_id":{"$oid":"5dcad79be032c89c33eda9ff"},"name":"god","claims":["admin"],"users":[{"$oid":"5dcad79be032c89c33eda9f4"}],"services":["auth-service","user-service","api-service","mapping-service","adapter-service"],"permissions":[{"$oid":"5dcad79be032c89c33eda9fe"}]}
{"_id":{"$oid":"5dcad79be032c89c33edaa03"},"name":"standard","claims":[],"users":[{"$oid":"60911c69b3f822aedb7474f1"},{"$oid":"60911c81b3f8221bad7474f2"}],"services":[],"permissions":[{"$oid":"5e14c8826ed91211d6b54518"},{"$oid":"5e14c89c6ed91211d6b54551"},{"$oid":"5e14cc236ed91211d6b54f78"},{"$oid":"5e14d2d26ed91211d6b56246"},{"$oid":"5e14c89c6ed91211d6b54552"},{"$oid":"5e14d0e76ed91211d6b55cb6"},{"$oid":"5e14d0ff6ed91211d6b55cfc"},{"$oid":"5e14cd276ed91211d6b5523b"},{"$oid":"5e14cd916ed91211d6b55352"},{"$oid":"5e14d1776ed91211d6b55e4c"}]}
ROLES

mongo <<APIKEYS
use admin
db.auth('$MONGO_INITDB_ROOT_USERNAME', '$MONGO_INITDB_ROOT_PASSWORD');

use auth-service

expiryDate = new Date();
expiryDate.setFullYear(expiryDate.getFullYear() + 1);
db.apikeys.insert([{
    name: 'auth-service',
    key: '$AUTH_SERVICE_API_KEY',
    expiryDate: expiryDate
},{
    name: 'user-service',
    key: '$USER_SERVICE_API_KEY',
    expiryDate: expiryDate
},{
    name: 'api-service',
    key: '$API_SERVICE_API_KEY',
    expiryDate: expiryDate
},{
    name: 'mapping-service',
    key: '$MAPPING_SERVICE_API_KEY',
    expiryDate: expiryDate
},{
    name: 'adapter-service',
    key: '$ADAPTER_SERVICE_API_KEY',
    expiryDate: expiryDate
},]);
APIKEYS