// middleware/requestLogger.js
const onFinished = require("on-finished");
const Log = require("../models/Log");        // or logService.createLog

module.exports = function requestLogger(req, res, next) {
    if (req.method === "GET") return next();          // GET은 스킵

    const start = Date.now();

    /* --- 응답이 끝난 뒤 실행 --- */
    onFinished(res, async (err) => {
        try {
            const elapsed = Date.now() - start;

            /* response body 캡처 : res.locals._body 에 담아두는 방식을 사용 */
            const responseData = res.locals._body
                ? JSON.stringify(res.locals._body).slice(0, 10_000) // 너무 길면 컷
                : null;

            await Log.create({
                endpoint: req.originalUrl,
                method: req.method,
                status_code: res.statusCode,
                request_time: new Date(start),
                response_time: new Date(),
                response_data: responseData,
                request_data: JSON.stringify({
                    params: req.params,
                    query: req.query,
                    body: req.body,
                }),
                error_message: err ? err.message : null,
            });
        } catch (e) {
            console.error("[requestLogger] failed to write log:", e.message);
        }
    });

    /* --- res.json/ res.send 래핑 : 응답 본문을 가로채기 위함 --- */
    const origJson = res.json.bind(res);
    res.json = (body) => {
        res.locals._body = body;
        return origJson(body);
    };

    const origSend = res.send.bind(res);
    res.send = (body) => {
        res.locals._body = body;
        return origSend(body);
    };

    next();
};
