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
var i = 0;
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
	//GoPressure = true;
	
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
	
	p /= 100;
	return p;
};

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
	this.currentAltitude = 0;
	this.coeffs = {};
	this.board.sendI2CConfig();
	var that = this;
	async.series([
		function (callback) {
			that.setCoeffs(callback);
		},
		function (callback) {
			async.forever(
				function (callback) {
						GetData(callback);
				},
				function (err) {
					console.log("Error", err);
				}
			);
				//function (err) {
					//console.log("Error :", err);
					
				//});
		}
	],
	function (err) {
		console.log("Error :", err);
	});
	
	function GetData(callback) {
		async.series([
			function (callback) {
				that.requestTemperature(callback);
			},
			function (callback) {
				that.requestPressure(callback);	
			},
			function (callback) {
				that.getCalculatedAltitude();
				callback(null);
			},
			function (callback) {
				setTimeout(function() {
					console.log("Waiting......");
				},10000);
				callback(null);
			}
		], function (err) {
			console.log("Error : ",err);
			callback(null);
		});
	}
};

Bmp180.prototype = {
	setCoeffs: function (callb) {
		var that = this;
		function done(err) {
			if (err) {
				throw err;
			}
			console.log("Done!");
			callb();
		};
		nameArray = [
			{get:"CAL_AC1", signed: true},
			{get:"CAL_AC2", signed: true},
			{get:"CAL_AC3", signed: true},
			{get:"CAL_AC4", signed: false},
			{get:"CAL_AC5", signed: false},
			{get:"CAL_AC6", signed: false},
			{get:"CAL_B1", signed: true},
			{get:"CAL_B2", signed: true},
			{get:"CAL_MB", signed: true},
			{get:"CAL_MC", signed: true},
			{get:"CAL_MD", signed: true}
		];
				
		function iterator(value, callback) {
			readInit(registerAddresses[value.get], value.signed, callback);
			
		};

		function readInit(address, signed, callback) {
			that.board.sendI2CWriteRequest(0x77, [address]);
			that.board.sendI2CReadRequest(0x77, 2, function(data){

			data = (data[0] << 8) | data[1];
		
				if (signed) {
					data = that.makeS16(data);
				}

				that.coeffs[address] = data;
				callback(null);
				
				console.log("Register address : " + address + " " + "Data : "+ data);
	  		}.bind(this));
		};

		async.forEachSeries(nameArray, iterator, done);

	},
	read16: function (address,signed,callback) {
		this.board.sendI2CWriteRequest(0x77,[address]);
		this.board.sendI2CReadRequest(0x77, 2, function(data){
			console.log("RawData",data);
			data = (data[0] << 8) | data[1];
			console.log("Shifted Data",data);
			if (signed) {
				data = this.makeS16(data);
				console.log("signed",data);
			}
			callback(data);
	  	}.bind(this));
	},
	requestTemperature: function (callback) {
		this.writeTo(registerAddresses.CONTROL, registerAddresses.READTEMPCMD);
		var that = this;
		setTimeout(function() {
			this.read16(registerAddresses.TEMPDATA, false, function (data) {
				this.currentTemp = getCalculatedTemperature(data, this.coeffs);
				callback(null);
			}.bind(this));
		}.bind(this), 10);
	},
	requestPressure: function (callback) {
		this.writeTo(registerAddresses.CONTROL, registerAddresses.READPRESSURECMD);
		var that  = this;
		setTimeout(function() {
			this.read16(registerAddresses.PRESSUREDATA, false, function (data) {
				this.currentPress = getCalculatedPressure(data, this.coeffs);
				callback(null);
			}.bind(this));
		}.bind(this),10);
	},
	getCalculatedAltitude: function () {
	 	var altitude;
	 	altitude = 44330.0 * (1.0 - (Math.pow(((this.currentPress/100.0) /101325.0),(1903/1000))));
	 	console.log("Altitude ", altitude/1000);
	},
	getCurrentTemp: function () {
		return this.currentTemp;
	},
	getCurrentPress: function () {
		return this.currentPress;
	},
	//read8: function (address) { 
	//	console.log("read8::address: ",address);
	//	this.board.sendI2CWriteRequest(0x77,[address]);
	//	this.board.sendI2CReadRequest(0x77,1,function(data){
	//		console.log("read8",data);
	//		return data;
	  //	};
	//},
	makeS16: function (number) {
		var signed;
		if (number > 32767) {
  			signed = ((-65536) + number);
		} else {
			signed = number;
		}
	
		return signed;
	},
	
	writeTo : function (address, byte) {
		this.board.sendI2CWriteRequest(0x77,[address,byte]);
	}
	
};

module.exports = Bmp180;