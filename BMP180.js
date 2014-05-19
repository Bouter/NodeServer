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

function Bmp180(board){
	this.calibrated = false;
	this.board = board;
	this.currentTemp = 0;
	this.coeffs = {};

	this.setCoeffs();
	this.requestTemperature();
}

Bmp180.prototype = {
	requestTemperature: function () {
		if (this.calibrated) {
			this.writeTo(registerAddresses.CONTROL, registerAddresses.READTEMPCMD);
			var that = this;
			setTimeout(function() {
				var UT = that.read16(registerAddresses.TEMPDATA, function () {
					that.currentTemp = getCalculatedTemperature(UT, that.coeffs);
				});
			}, 5);
			
		}
	},
	getCurrentTemp: function () {
		//this.requestTemperature();
		return this.currentTemp;
	},
	read8: function (address) {
		this.board.sendI2CWriteRequest(0x77,[address]);
		this.board.sendI2CReadRequest(0x77,1,function(data){
			console.log("read8",data);
			return data;
	  	});
	},
	read16: function (address,callback) {
		this.board.sendI2CWriteRequest(0x77,[address]);
		this.board.sendI2CReadRequest(0x77,2,function(data){
			console.log(data);
			data = (data[0] << 8) | data[1];
			console.log("read16",data);
			callback();
			return data;
	  	});
	},
	writeTo : function (address, byte) {
		this.board.sendI2CWriteRequest(0x77,[address,byte]);
	},
	setCoeffs: function () {
		this.coeffs.ac1 = 6836; //this.read16(registerAddresses.CAL_AC1);
		this.coeffs.ac2 = 64406; //this.read16(registerAddresses.CAL_AC2);
		this.coeffs.ac3 = 51060; //this.read16(registerAddresses.CAL_AC3);
		this.coeffs.ac4 = 34018; // this.read16(registerAddresses.CAL_AC4);
		this.coeffs.ac5 = 25640; // this.read16(registerAddresses.CAL_AC5);
		this.coeffs.ac6 = 14470; //this.read16(registerAddresses.CAL_AC6);
		//this.coeffs.b1 = this.read16(registerAddresses.CAL_B1);
		//this.coeffs.b2 = this.read16(registerAddresses.CAL_B2);
		this.coeffs.md = 2430; // this.read16(registerAddresses.CAL_MD);
		this.coeffs.mc = 53750; //this.read16(registerAddresses.CAL_MC);
		//this.coeffs.mb = this.read16(registerAddresses.CAL_MB);
		this.calibrated = true;

	}
}


module.exports = Bmp180;