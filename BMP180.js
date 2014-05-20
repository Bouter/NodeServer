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
	this.board.sendI2CConfig();
	this.setCoeffs();
	this.requestTemperature();
}

Bmp180.prototype = {
	requestTemperature: function () {
		if (this.calibrated) {
			this.writeTo(registerAddresses.CONTROL, registerAddresses.READTEMPCMD);
			var that = this;
			setTimeout(function() {
				that.read16(registerAddresses.TEMPDATA, function (UT) {
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
		console.log("read8::address: ",address);
		this.board.sendI2CWriteRequest(0x77,[address]);
		this.board.sendI2CReadRequest(0x77,1,function(data){
			console.log("read8",data);
			return data;
	  	});
	},
	read16: function (address,callback) {
		console.log("read16::address: ",address);
		this.board.sendI2CWriteRequest(0x77,[address]);
		this.board.sendI2CReadRequest(0x77,2,function(data){
			console.log(data);
			var sign = data[0] & (1 << 7);
			data = (data[0] << 8) | data[1];
			if (sign) {
			    data = -data;
			}
			console.log("read16",data);
			callback(data);
			return data;
	  	});
	},
	readS16: function (address) {
		var i;
		i = (read16(address) << 31);
		data = i;
		console.log("readS16::Data ",data);
		return data;
	}
	writeTo : function (address, byte) {
		this.board.sendI2CWriteRequest(0x77,[address,byte]);
	},
	setCoeffs: function () {
		var that = this;
		this.coeffs.ac1 = this.readS16(registerAddresses.CAL_AC1,function () {
			that.coeffs.ac2 = that.readS16(registerAddresses.CAL_AC2, function () {
				that.coeffs.ac3 = that.readS16(registerAddresses.CAL_AC3,function () {
					that.coeffs.ac4 = that.read16(registerAddresses.CAL_AC4, function () {
						that.coeffs.ac5 = that.read16(registerAddresses.CAL_AC5,function () {
							that.coeffs.ac6 = that.read16(registerAddresses.CAL_AC6, function () {
								that.coeffs.b1 = that.readS16(registerAddresses.CAL_B1,function () {
									that.coeffs.b2 = that.readS16(registerAddresses.CAL_B2, function () {
										that.coeffs.md = that.readS16(registerAddresses.CAL_MD,function () {
											that.coeffs.mc = that.readS16(registerAddresses.CAL_MC, function () {
												that.coeffs.mb = that.readS16(registerAddresses.CAL_MB, function () {
													that.calibrated = true;
												});
											});
										});
									});
								});
							});
						});
					});
				});
			});
		});
	}
}


module.exports = Bmp180;