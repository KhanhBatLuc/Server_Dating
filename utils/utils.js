
const DATE_DIFF = require("date-diff-js");

let generateRandomNum = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
};


let metaResponse = (status, result, message) => {
    return {
        code: status,
        result: result,
        message: message
    }
};

let metaError = (status, result, message, type) => {
    return {
        code: status,
        result: result,
        message: message,
        type: type
    }
};

let arrayRemove = (arr, value) => {

    return arr.filter(function (ele) {
        return ele._id !== value;
    });

};

let distance = (lat1, lon1, lat2, lon2) => {
    if ((lat1 == lat2) && (lon1 == lon2)) {
        return 0;
    }
    else {
        var radlat1 = Math.PI * lat1 / 180;
        var radlat2 = Math.PI * lat2 / 180;
        var theta = lon1 - lon2;
        var radtheta = Math.PI * theta / 180;
        var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
        if (dist > 1) {
            dist = 1;
        }
        dist = Math.acos(dist);
        dist = dist * 180 / Math.PI;
        dist = dist * 60 * 1.1515;
        dist = dist * 1.609344;
        return dist;
    }
};

let lastTime = (time) => {
    const diff = DATE_DIFF(time, new Date(), 'H').outputs;
    if (time == 0 || DATE_DIFF(time, new Date(), 'M').output == 0) {
        return "Đang hoạt động";
    }
    if (diff.minutes > 60) {
        if (diff.hours > 24) {
            return "Hoạt động " + diff.days + " ngày trước";
        } else {
            return "Hoạt động " + diff.hours + " giờ trước";
        }
    } else {
        return "Hoạt động " + diff.minutes + " phút trước";
    }
}

module.exports = {
    generateRandomNum,
    metaResponse,
    metaError,
    arrayRemove,
    distance,
    lastTime,
};