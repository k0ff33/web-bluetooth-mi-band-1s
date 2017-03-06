let device, server;

function connect() {
    return navigator.bluetooth.requestDevice({
            filters: [{
                name: 'MI1S'
            }],
            // acceptAllDevices: true,
            optionalServices: [0x1802, 0xfee0, 0x180d]
        })
        .then(dev => device = dev)
        .then(device => device.gatt.connect())
        .then(serv => server = serv)
        // .then(server => server.getPrimaryService(0xfee0))
        // .then(service => service.getCharacteristic(0xff0a))
        // .then(characteristic => characteristic.readValue()) // this theoretically helps with connection problems
        // .then(data => console.log(data.getUint8(0)))
        .catch(console.error)
}

function disconnect() {
    if (device) {
        device.gatt.disconnect()
        console.lofg(`Disconnected device: ${device.name}`);
    } else {
        console.log('Not connected!');
    }
}

function checkIfConnected() {
    if (!device || !server || !device.gatt.connected) {
        return connect();
    } else {
        return Promise.resolve();
    }
}

function vibrate() {
    checkIfConnected()
        .then(() => server.getPrimaryService(0x1802))
        .then(service => service.getCharacteristic(0x2A06))
        .then(characteristic => {
            var data = new Uint8Array([0x02]);
            return characteristic.writeValue(data);
        })
        .catch(error => {
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

function pair() {
    let serv;
    checkIfConnected()
    .then(() => server.getPrimaryService(0xfee0))
    .then(service => {
        serv = service;
        return service.getCharacteristic(0xff0f);
    })
    .then(characteristic => characteristic.writeValue(new Uint8Array([2]))) // pair
    .then(data => {
        let res = data.getUint8(0);
        if (res == 0) {
            console.log('Successfully paired!');
        }
        else {
            throw new Error('Pairing error');
        }
    })
    .then(() => serv.getCharacteristic(0xff01)) // request device info
    .then(characteristic => characteristic.readValue())
    // .then(() => serv.getCharacteristic(0xff04)) // user info
    .catch(console.error)
}

function getBatteryLvl() {
    checkIfConnected()
        .then(() => server.getPrimaryService(0xfee0))
        .then(service => service.getCharacteristic(0xff0c))
        .then(characteristic => characteristic.readValue())
        .then(data => {
            let lastCharged = new Date(data.getUint8(1) + 2000, data.getUint8(2), data.getUint8(3), data.getUint8(4), data.getUint8(5), data.getUint8(6));
            console.log(`Battery: ${data.getUint8(0)}%`)
            console.log(`Last charged: ${lastCharged.toString()}`)
        })
        .catch(e => console.error(e))
}

function getHR() {
    checkIfConnected()
        .then(() => server.getPrimaryService(0x180d))
        .then(service => service.getCharacteristic(0x2A39))
        .then(characteristic => {
            let data = new Uint8Array([0x15, 0x1, 0]);
            return characteristic.writeValue(data)
                .then(() => characteristic);
        })
        .then(characteristic => {
            let data = new Uint8Array([0x15, 0x2, 0]);
            return characteristic.writeValue(data)
                .then(() => characteristic);
        })
        .then(characteristic => {
            let data = new Uint8Array([0x15, 0x2, 1]);
            return characteristic.writeValue(data)
                .then(() => characteristic);
        })
        .then(characteristic => characteristic.startNotifications())
        .then(handleHeartRateMeasurement)
        .catch(e => console.error(e))
}

function handleHeartRateMeasurement(heartRateMeasurement) {
  heartRateMeasurement.addEventListener('characteristicvaluechanged', event => {
      debugger;
  });
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