var getTime = function() {
    var currentdate = new Date();
    var hour = currentdate.getHours().toString();
    var minute = currentdate.getMinutes().toString();
    var currentTime = Number(hour.concat(minute));
    console.log("hour:" + hour + " minute : " + minute);
    return currentTime;

}


module.exports.time = getTime();