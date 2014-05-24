"use strict";

var async = require('async');

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
	TEMPDATAL : 0XF7,
	PRESSUREDATA : 0xF6,
	READTEMPCMD : 0x2E,
	READPRESSURECMD : 0x34
};
var p;
var checkCoeffs;
var nameArray;
var GoPressure = false;
var GoAltitude = false;
var B5;
var altitude;
var getCalculatedTemperature = function (UT, coeffs) {
	var X1, X2, t;
 
	X1 = (UT - coeffs[registerAddresses.CAL_AC6]) * (coeffs[registerAddresses.CAL_AC5]) / Math.pow(2,15);
	X2 = (coeffs[registerAddresses.CAL_MC] * Math.pow(2,11)) / (X1+coeffs[registerAddresses.CAL_MD]);
	B5 = X1 + X2;
	t = (B5+8)/Math.pow(2,4);
	t /= 10;
	console.log("Temperature ", t);
	GoPressure = true;

	return t;
};

var getCalculatedPressure = function (UP, coeffs) {
	var X1, X2, X3, B3, B4, B6, B7;

	B6 = B5 - 4000;
	X1 = (coeffs[registerAddresses.CAL_B2] * ((B6 * B6) >> 12)) >> 11;
	X2 = (coeffs[registerAddresses.CAL_AC2] * B6) >> 11;
	X3 = X1 + X2;
	B3 = (((coeffs[registerAddresses.CAL_AC1] * 4 + X3) << 0) + 2) / 4;
	X1 = (coeffs[registerAddresses.CAL_AC3] * B6) >> 13;
	X2 = (coeffs[registerAddresses.CAL_B1] * ((B6 * B6) >> 12)) >> 16;
	X3 = ((X1 + X2) + 2) >> 2;
	B4 = (coeffs[registerAddresses.CAL_AC4] * (X3 + 32768)) >> 15;
	B7 = ((UP - B3) * (50000 >> 0));
	if (B7 < 0X80000000){
		p = (B7 * 2) / B4;
	}else{
		p = (B7 / B4) * 2;
	}
	X1 = (p >> 8) * (p >> 8);
	X1 = (X1 * 3038) >> 16;
	X2 = (-7357 * p)  >> 16;
	p = p + ((X1 + X2 + 3791) >> 4);
	console.log("Pressure ",p/100);
	GoAltitude = true;
	if (GoAltitude){
		altitude = 44330.0 * (1.0 - (Math.pow(((p/100.0) /101325.0),(1903/1000))));
		console.log("Altitude ", altitude/1000);
	}
	
	return p;
};

// var getCalculatedAltitude = function () {

// 	var altitude;
// 	var pp = this.requestPressure();
// 	console.log("pw ", p);
// 	altitude = 44330.0 * (1.0 - (Math.pow(((pp/100.0) /101325.0),(1903/1000))));
// 	console.log("Altitude ", altitude);
// 	return altitude;
// }


Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};


function Bmp180(board) {
	this.calibrated = false;
	this.board = board;
	this.board.setMaxListeners(100);
	this.currentTemp = 0;
	this.currentPress = 0;
	this.coeffs = {};
	this.board.sendI2CConfig();
	var that = this;
	this.x = setInterval(function() {
		checkFinishedCoeffs();
	}, 5000);
	function checkFinishedCoeffs() {
		that.requestTemperature();
		if (GoPressure) {
			that.requestPressure();
		}
		
	};
	this.setCoeffs();
}

Bmp180.prototype = {
	async.series([
		function () {
			setCoeffs: function () {
				checkCoeffs = setInterval(function () {
					var coeffSize = Object.size(this.coeffs)
					
					if (Object.size(this.coeffs) == 11) {
						this.calibrated = true;
						clearInterval(checkCoeffs);
					}
					nameArray = [
						{get:"CAL_AC1",request:false,got:false, signed: true},
						{get:"CAL_AC2",request:false,got:false, signed: true},
						{get:"CAL_AC3",request:false,got:false, signed: true},
						{get:"CAL_AC4",request:false,got:false, signed: false},
						{get:"CAL_AC5",request:false,got:false, signed: false},
						{get:"CAL_AC6",request:false,got:false, signed: false},
						{get:"CAL_B1",request:false,got:false, signed: true},
						{get:"CAL_B2",request:false,got:false, signed: true},
						{get:"CAL_MB",request:false,got:false, signed: true},
						{get:"CAL_MC",request:false,got:false, signed: true},
						{get:"CAL_MD",request:false,got:false, signed: true}
					];
					if (nameArray[coeffSize-1] != undefined && nameArray[coeffSize-1].got== false) {
						nameArray[coeffSize-1].got= true;
					}
					if (nameArray[coeffSize] != undefined && nameArray[coeffSize].request == false) {
						this.read16(registerAddresses[nameArray[coeffSize].get], nameArray[coeffSize].signed);
						nameArray[coeffSize].request = true;
					}

				}.bind(this), 2000);
			}
		},
		function () {
			requestTemperature: function () {
				if (this.calibrated) {
					this.writeTo(registerAddresses.CONTROL, registerAddresses.READTEMPCMD);
					var that = this;
					setTimeout(function() {
						this.read16(registerAddresses.TEMPDATA, true, function (data) {
							this.currentTemp = getCalculatedTemperature(data, this.coeffs);
							if (GoPressure) {
								this.requestPressure();
							}
						}.bind(this));
					}.bind(this), 5);
					//clearInterval(this.x);		
				}
			}
		},
		function () {
			requestPressure: function () {
		
				if (GoPressure) {
					this.writeTo(registerAddresses.CONTROL, registerAddresses.READPRESSURECMD);
					var that  = this;
					setTimeout(function() {
						this.read16(registerAddresses.PRESSUREDATA, false, function (data) {
							this.curentPress = getCalculatedPressure(data, this.coeffs);
							
						}.bind(this));
					}.bind(this),5);
					//clearInterval(this.x);
				}
			}
		}
		]);
	
	getCurrentTemp: function () {
		return this.currentTemp;
	},
	getCurrentPress: function () {
		return this.currentPress;
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
		// console.log(number);
		if (number > 32767) {
  			signed = ((-65536) + number);
		} else {
			signed = number;
		}
	
		return signed;
	},
	read16: function (address,signed,callback) {
		var that = this;
		
		this.board.sendI2CWriteRequest(0x77,[address]);
		this.board.sendI2CReadRequest(0x77, 2, function(data){

			data = (data[0] << 8) | data[1];
			
			if (signed) {
				data = that.makeS16(data);
			}

			if (typeof(callback) == "function") {
				callback(data);
			} else {
				this.coeffs[address] = data;
			}

	  	}.bind(this));
	},
	writeTo : function (address, byte) {
		this.board.sendI2CWriteRequest(0x77,[address,byte]);
	}
	
}


module.exports = Bmp180;