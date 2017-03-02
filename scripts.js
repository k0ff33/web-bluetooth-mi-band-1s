let device, server;

function connect() {
    return navigator.bluetooth.requestDevice({
            filters: [{
                name: 'MI1S'
            }],
            optionalServices: [0x1802, 0xfee0]
        })
        .then(dev => device = dev)
        .then(device => device.gatt.connect())
        .then(serv => server = serv)
        .catch(console.error)
}

function checkIfConnected() {
    if (!device || !server) {
        return connect();
    } else {
        return Promise.resolve();
    }
}

function vibrate() {
    checkIfConnected()
        .then(() => server.getPrimaryService(0x1802))
        .then(function (service) {
            // debugger;
            // Step 4: get the Characteristic
            return service.getCharacteristic(0x2A06);
        })
        .then(function (characteristic) {
            // Step 5: Write to the characteristic
            var data = new Uint8Array([0x02]);
            return characteristic.writeValue(data);
        })
        .catch(function (error) {
            // And of course: error handling!
            console.error('Connection failed!', error);
        });
}

function getName() {
    checkIfConnected()
        .then(() => {
            console.log('> Name:             ' + device.name);
            console.log('> Id:               ' + device.id);
            console.log('> Connected:        ' + device.gatt.connected);
        })
}

function getBatteryLvl() {
    checkIfConnected()
        .then(() => server.getPrimaryService(0xfee0))
        .then(service => service.getCharacteristic(0xff0c))
        .then(characteristic => characteristic.readValue())
        .then(data => console.log(`${data.getUint8(0)}%`))
        .catch(e => console.error(e))
}

function disconnect() {
    if (device) {
        device.gatt.disconnect()
            .catch(e => console.error(e));
        console.log('Disconnected');
    } else {
        console.log('Not connected!');
    }
}



/* Helper Functions */

function uintToString(uintArray) {
    var encodedString = String.fromCharCode.apply(null, uintArray),
        decodedString = decodeURIComponent(escape(encodedString));
    return decodedString;
}

function arrayBufferToString(buffer) {
    var arr = new Uint8Array(buffer);
    var str = String.fromCharCode.apply(String, arr);
    if (/[\u0080-\uffff]/.test(str)) {
        throw new Error("this string seems to contain (still encoded) multibytes");
    }
    return str;
}

function parse(value) {
    // In Chrome 50+, a DataView is returned instead of an ArrayBuffer.
    value = value.buffer ? value : new DataView(value);
    let result = {};
    let index = 1;
    debugger;

    result.test = value.getInt8(index);
    result.test2 = value.getInt16(index);
    result.test3 = value.getUint8(index);
    result.test4 = value.getUint16(index);
    result.test5 = value.getUint32(index);
    result.test6 = value.getFloat32(index);
    // result.test7 = value.getFloat64(index);

    return result;
}