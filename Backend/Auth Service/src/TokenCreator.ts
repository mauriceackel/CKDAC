import readline from 'readline';
import jwt from 'jsonwebtoken';
import { ACCESS_TOKEN_PRIV } from './config/Config';

console.log("// WELCOME TO THE TOKEN CREATOR \\\\");
console.log("This tool lets you create a JWT token that is signed with the current access token private key.\n");
console.log("When promted, please enter a key and confirm with the enter key. Then enter the value for this key.");
console.log("To finish the process, leave the key empty and press enter!");

const reader = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

reader.question("Enter JSON payload: ", jsonPayload => {
    let payload = JSON.parse(jsonPayload);

    reader.question("How many seconds should the token be valid? ", ttlSec => {
        payload.exp = Math.floor((Date.now() / 1000 + Number.parseInt(ttlSec)));

        let token = jwt.sign(payload, ACCESS_TOKEN_PRIV, { algorithm: "RS512" });
        console.log(" \\\\ YOUR TOKEN IS //");
        console.log(token);

        reader.close();
    });
});

// do {
//     let key = readline.question("KEY: ");
//     if (!key) {
//         if (readline.keyInYN('Do you really want to finish?')) {
//             break;
//         } else {
//             continue;
//         }
//     }

//     let untypedValue = readline.question("VALUE: ");
//     let typedValue: any;

//     let types = ["string", "number", "object"];
//     let typeIndex = readline.keyInSelect(types, 'Which type?', { cancel: false });
//     switch (typeIndex) {
//         case 0: typedValue = untypedValue.toString(); break;
//         case 1: typedValue = Number.parseFloat(untypedValue); break;
//         case 2:
//         default: typedValue = JSON.parse(untypedValue);
//     }

//     jwtPayload[key] = (typedValue) ? typedValue : null;
// } while (true);

// let ttlSec = Number.parseInt(readline.question("How many seconds should the token be valid? ", { defaultInput: "0" }));
// jwtPayload.exp = Math.floor((Date.now() / 1000 + ttlSec));