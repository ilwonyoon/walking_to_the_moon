var getDate = function() {
    today = new Date();
    var dd = today.getDate().toString();

    //getMonth() only returns 0-12, but we need 01,02...12 for data format
    var mm = today.getMonth() + 1; //January is 0!
    if (mm < 9) {
        mm = mm.toString();
        var add_zero = "0";
        mm = add_zero.concat(mm);
    } else {
        mm.toString();

    }
    var yyyy = today.getFullYear().toString();
    var today = Number(yyyy.concat(mm, dd));
    return today;
}
module.exports.date = getDate();