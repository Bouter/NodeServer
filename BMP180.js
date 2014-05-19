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

var getCalculatedTemperature = function (temp) {
	var UT, X1, X2, B5, t;
 
  	X1 = (temp - Bmp180.coeffs.ac6) * (Bmp180.coeffs.ac5) / Math.pow(2,15);
	X2 = (coeffs.mc * Math.pow(2,11)) / (X1+coeffs.md);
	B5 = X1 + X2;
	t = (B5+8)/Math.pow(2,4);
	t /= 10;

	return t;
};

function Bmp180(board){
	this.board = board;
	this.currentTemp = 0;
	this.coeffs = {
    	ac6 : 23153,
    	ac5 : 32757,
    	mc: -8711,
    	md: 2868
    };

	this.requestTemperature();
}

Bmp180.prototype = {
	requestTemperature: function () {
		this.read16(registerAddresses.TEMPDATA);
	},
	getCurrentTemp: function () {
		this.requestTemperature();
		return this.currentTemp;
	},
	read8: function (address) {
		this.board.sendI2CWriteRequest(0x77,[address]);
		this.board.sendI2CReadRequest(0x77,1,function(data){
			console.log("read8",data);
			return data;
	  	});
	},
	read16: function (address) {
		this.board.sendI2CWriteRequest(0x77,[address]);
		this.board.sendI2CReadRequest(0x77,2,function(data){
			console.log("read16",data);
			return data;
	  	});
	},
	setCoeffs: function () {
		this.coeffs.ac1 = this.read16(registerAddresses.CAL_AC1);
	}
}


module.exports = Bmp180;