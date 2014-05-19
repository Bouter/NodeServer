var getCalculatedTemperature = function (temp) {


	var UT, X1, X2, B5, t;
	var UT = 27898;
    var coeffs = {
    	ac6 : 23153,
    	ac5 : 32757,
    	mc: -8711,
    	md: 2868
    };
    
  	X1 = (UT - coeffs.ac6) * (coeffs.ac5) / Math.pow(2,15);
	X2 = (coeffs.mc * Math.pow(2,11)) / (X1+coeffs.md);
	B5 = X1 + X2;
	t = (B5+8)/Math.pow(2,4);
	t /= 10;

	return t;
};

function Bmp180(board){
	this.board = board;
	this.currentTemp = 0;

	this.requestTemperature();
}

Bmp180.prototype = {
	requestTemperature: function () {
		this.board.sendI2CWriteRequest(0x77,[0xF6]);
		this.board.sendI2CReadRequest(0x77,2,function(temp){
			console.log(temp[0]);
			this.currentTemp = getCalculatedTemperature(temp[0]);
	  	});
	},
	getCurrentTemp: function () {
		this.requestTemperature();
		return this.currentTemp;
	}
}


module.exports = Bmp180;