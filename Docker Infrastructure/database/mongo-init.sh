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
{"_id":{"$oid":"5e14d2219db771209adf8313"},"name":"createAdapter","method":"POST","url":"^.*/adapters/generate/[^/]+/?$"}
{"_id":{"$oid":"5e14d2219db771209adf8314"},"name":"createAdapter","method":"GET","url":"^.*/adapters/download/[^/]+/?$"}
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
{"_id":{"$oid":"5e14d0ff6ed91211d6b55cfc"},"name":"generateMapping","activities":[{"$oid":"5e14cffe9db771209adf8312"}]}
{"_id":{"$oid":"5e14cd276ed91211d6b5523b"},"name":"createMapping","activities":[{"$oid":"5e14cfdb9db771209adf830e"}]}
{"_id":{"$oid":"5e14cd916ed91211d6b55351"},"name":"getMapping","activities":[{"$oid":"5e14cf5f9db771209adf8308"}]}
{"_id":{"$oid":"5e14cd916ed91211d6b55352"},"name":"listMappings","activities":[{"$oid":"5e14cfab9db771209adf830b"}]}
{"_id":{"$oid":"5e14d1776ed91211d6b55e4c"},"name":"createAdapter","activities":[{"$oid":"5e14d2219db771209adf8313"},{"$oid":"5e14d2219db771209adf8314"}]}
PERMISSIONS

mongoimport --username=$MONGO_INITDB_ROOT_USERNAME --password=$MONGO_INITDB_ROOT_PASSWORD --authenticationDatabase=admin --db=user-service --collection=users <<USERS
{"_id":{"\$oid":"5dcad79be032c89c33eda9f4"},"password":"$APP_ROOT_PW","email":"$APP_ROOT_USER","firstname":"Root","lastname":"User","type":0}
USERS

mongoimport --username=$MONGO_INITDB_ROOT_USERNAME --password=$MONGO_INITDB_ROOT_PASSWORD --authenticationDatabase=admin --db=auth-service --collection=roles <<"ROLES"
{"_id":{"$oid":"5dcad79be032c89c33eda9ff"},"name":"god","claims":["admin"],"users":[{"$oid":"5dcad79be032c89c33eda9f4"}],"services":["auth-service","user-service","api-service","mapping-service","adapter-service"],"permissions":[{"$oid":"5dcad79be032c89c33eda9fe"}]}
{"_id":{"$oid":"5dcad79be032c89c33edaa03"},"name":"standard","claims":[],"users":[],"services":[],"permissions":[{"$oid":"5e14c8826ed91211d6b54518"},{"$oid":"5e14c89c6ed91211d6b54551"},{"$oid":"5e14cc236ed91211d6b54f78"},{"$oid":"5e14d2d26ed91211d6b56246"},{"$oid":"5e14c89c6ed91211d6b54552"},{"$oid":"5e14d0e76ed91211d6b55cb6"},{"$oid":"5e14d0ff6ed91211d6b55cfc"},{"$oid":"5e14cd276ed91211d6b5523b"},{"$oid":"5e14cd916ed91211d6b55352"},{"$oid":"5e14d1776ed91211d6b55e4c"}]}
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