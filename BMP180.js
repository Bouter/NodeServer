"use strict";
var events = require('events');

events.setMaxListeners(100);

var registerAddresses = {
  CAL_AC1 : 0xAA, // R Calibration data (16 bits)
 	CAL_AC2 : 0xAC, // R Calibration data (16 bits)
	CAL_AC3 : 0xAE, // R Calibration data (16 bits)
	CAL_AC4 : 0xB0, // R Calibration data (16 bits)
	CAL_AC5 : 0xB2, // R Calibration data (16 bits)
	CAL_AC6 : 0xB4, // R Calibration data (16 bits)
	CAL_B1 : 0xB6, // R Calibration data (16 bits)
	CAL_B2 : 0xB8, // R Calibration data (16 bits)
	CAL_MB : 0xBA, // R Calibration data (16 bits)
	CAL_MC : 0xBC, // R Calibration data (16 bits)
	CAL_MD : 0xBE, // R Calibration data (16 bits)
	CHIPID : 0xD0,
	VERSION : 0xD1,
	SOFTRESET : 0xE0,
	CONTROL : 0xF4,
	TEMPDATA : 0xF6,
	PRESSUREDATA : 0xF6,
	READTEMPCMD : 0x2E,
	READPRESSURECMD : 0x34
};

var getCalculatedTemperature = function (UT, coeffs) {
	var X1, X2, B5, t;
 
	X1 = (UT - coeffs.ac6) * (coeffs.ac5) / Math.pow(2,15);
	X2 = (coeffs.mc * Math.pow(2,11)) / (X1+coeffs.md);
	B5 = X1 + X2;
	t = (B5+8)/Math.pow(2,4);
	t /= 10;

	console.log(UT ,X1, X2, B5, t);

	return t;
};

Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};


function Bmp180(board) {
	// this.calibrated = false;
	this.board = board;
	this.currentTemp = 0;
	this.coeffs = {};
	this.board.sendI2CConfig();
	var that = this;
	this.x = setInterval(function() {
		checkFinishedCoeffs();
	}, 500);
	function checkFinishedCoeffs() {
		that.requestTemperature();
	};
	this.setCoeffs();
}

Bmp180.prototype = {
	requestTemperature: function () {
		console.log("checka");
		if (this.coeffs.mb) {
			this.writeTo(registerAddresses.CONTROL, registerAddresses.READTEMPCMD);
			var that = this;
			console.log("check");
			setTimeout(function() {
				that.read16(registerAddresses.TEMPDATA, function (UT) {
					that.currentTemp = getCalculatedTemperature(UT, that.coeffs);
					console.log("Temp : ",that.currentTemp);
				});
			}, 5);
			clearInterval(this.x);
			console.log('should stop interval');
		}
	},
	getCurrentTemp: function () {
		return this.currentTemp;
	},
	read8: function (address) {
		console.log("read8::address: ",address);
		this.board.sendI2CWriteRequest(0x77,[address]);
		this.board.sendI2CReadRequest(0x77,1,function(data){
			console.log("read8",data);
			return data;
	  	});
	},
	makeS16: function (number) {
		var signed;
		console.log(number);
		if (number > 32767) {
  			signed = ((-65536) + number);
		} else {
			signed = number;
		}
		
	 	
		console.log("Signed",signed);
		
		return signed;
	},
	read16: function (address,signed) {
		var that = this;
		console.log("read16::address: ", address);
		
		this.board.sendI2CWriteRequest(0x77,[address]);
		this.board.sendI2CReadRequest(0x77, 2, function(data){

			console.log("Test",data);
			data = (data[0] << 8) | data[1];
			console.log("read16",data);
			if (typeof(callback) == "function") {
				callback(data);
			}
			
			if (signed) {
				data = that.makeS16(data);
			}

			this.coeffs[address] = data;

	  	}.bind(this));
	},
	writeTo : function (address, byte) {
		this.board.sendI2CWriteRequest(0x77,[address,byte]);
	},
	setCoeffs: function () {
		(setInterval(function () {
			console.log("check coeffs",that.coeffs);
			if (Object.size(this.coeffs) == 11) {
				calibrated = true;
				clearInterval(checkCoeffs);
			}
		}, 1000))(checkCoeffs);
		
		this.read16(registerAddresses.CAL_AC1, true);
		this.read16(registerAddresses.CAL_AC2, true);
		this.read16(registerAddresses.CAL_AC3, true);
		this.read16(registerAddresses.CAL_AC4, false);
		this.read16(registerAddresses.CAL_AC5,  false);
		this.read16(registerAddresses.CAL_AC6,  false);
		this.read16(registerAddresses.CAL_B1,  true);
		this.read16(registerAddresses.CAL_B2,  true);
		this.read16(registerAddresses.CAL_MD,  true);
		this.read16(registerAddresses.CAL_MC, true);
		this.read16(registerAddresses.CAL_MB, true);
	}
}


module.exports = Bmp180;