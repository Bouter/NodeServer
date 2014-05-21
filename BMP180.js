"use strict";



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

var checkCoeffs;
var nameArray;

var getCalculatedTemperature = function (UT, coeffs) {
	var X1, X2, B5, t;
 
	X1 = (UT - coeffs[registerAddresses.CAL_AC6]) * (coeffs[registerAddresses.CAL_AC5]) / Math.pow(2,15);
	X2 = (coeffs[registerAddresses.CAL_MC] * Math.pow(2,11)) / (X1+coeffs[registerAddresses.CAL_MD]);
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
	this.calibrated = false;
	this.board = board;
	this.board.setMaxListeners(100);
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
		if (this.calibrated) {
			this.writeTo(registerAddresses.CONTROL, registerAddresses.READTEMPCMD);
			var that = this;
			console.log("check");
			setTimeout(function() {
				this.read16(registerAddresses.TEMPDATA, true, function (data) {
					this.currentTemp = getCalculatedTemperature(data, this.coeffs);
					console.log(this.currentTemp);
				}.bind(this));
			}.bind(this), 5);
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
	read16: function (address,signed,callback) {
		var that = this;
		console.log("read16::address: ", address);
		
		this.board.sendI2CWriteRequest(0x77,[address]);
		this.board.sendI2CReadRequest(0x77, 2, function(data){

			console.log("Test",data[0]);
			data = (data[1] << 8) | data[0];
			console.log("read16",data);

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
	},
	setCoeffs: function () {
		checkCoeffs = setInterval(function () {
			var coeffSize = Object.size(this.coeffs)
			console.log("check coeffs",this.coeffs);
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
				nameArray[coeffSize].request = true
			}

		}.bind(this), 1000);
	}
}


module.exports = Bmp180;