const jwt = require('jsonwebtoken');
const redis_client = require('../config/redis_connect');
const db = require('../config/config').get();
const response = require('../config/response');


function verifyToken(req, res, next) {
    try {
        // Bearer tokenstring
        const token = req.headers.authorization.split(' ')[1];

        // console.log("token", req.headers.authorization.split(' ')[1])

        const decoded = jwt.verify(token, db.JWT_ACCESS_SECRET);
        req.userData = decoded;

        req.token = token;

        // console.log("token", token)
        // console.log("id", decoded.sub)

        // varify blacklisted access token.
        redis_client.get('BL_' + decoded.sub.toString(), (err, data) => {
            if (err)
                return res.status(response.SERVER_ERROR).json(
                    response.createResponse(response.ERROR, 'Đã xảy ra lỗi: ' + err)
                );

            if (data === token) return res.status(response.STATUS_UNAUTHORIZED).json(
                response.createResponse(response.ERROR, 'Phiên đăng nhập đã hết hạn')
            );
            next();
        })
    } catch (error) {

        return res.status(response.SERVER_ERROR).json(
            response.createResponse(response.ERROR, 'Đã xảy ra lỗi: hihiihhi' + error)
        );
    }
}

function verifyRefreshToken(req, res, next) {
    const token = req.body.token;

    if (token === null) return res.status(401).json({ status: false, message: "Invalid request." });
    try {
        const decoded = jwt.verify(token, db.JWT_REFRESH_SECRET);
        req.userData = decoded;

        // verify if token is in store or not
        redis_client.get(decoded.sub.toString(), (err, data) => {
            if (err) throw err;

            if (data === null) return res.status(401).json({ status: false, message: "Invalid request. Token is not in store." });
            if (JSON.parse(data).token != token) return res.status(401).json({ status: false, message: "Invalid request. Token is not same in store." });

            next();
        })
    } catch (error) {
        return res.status(401).json({ status: true, message: "Your session is not valid.", data: error });
    }
}

module.exports = {
    verifyToken,
    verifyRefreshToken
}