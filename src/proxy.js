var proxy = (function () {
    function getReq(id) {
        return o._reqMap[id]
    }
    // var reqCount = 0
    function setReq(id, req) {
        if (req == null) delete o._reqMap[id]; /// TODO  not use delete
        // else reqCount++;
        else o._reqMap[id] = req
    }

    function onSuccess(eventId) {
        return function (resp) {
            setReq(eventId, null)
            o._sendMsg(resp, eventId)
        }
    }

    function onError(eventId) {
        return function (xmlReq) {
            var req = getReq(eventId)
            setReq(eventId, null)

            o._sendMsg(null, eventId, errTransfer(xmlReq, req))
        }
    }

    function errTransfer(xmlReq, req) {
        return {
            readyState: xmlReq.readyState,
            status: xmlReq.status,
            responseText: xmlReq.responseText,
            timeout: req._timedOut,
            abort: req._aborted
        }
    }

    function send(param) {
        var id = param.eventId
        if (getReq(id)) {
            o._log("duplicate eventId: ", id)
        }
        param.success = onSuccess(id)
        param.error = onError(id)
        setReq(id, reqwest.compat(param)) /// save
    }

    function abort(data) {
        var id = data.eventId
        if (data.type === "abort" && id) {
            var req = getReq(id)
            // setReq(id, null)   /// do it in onError
            o._log("request abort:", id)
            if (req) req.abort()
            return true
        }
        return false
    }

    var isTop = window.parent === window;
    var o = {
        _log: function () {
            console.log.apply(console, arguments)
        },
        _reqMap: {},
        _allowOrigin: "*",
        _originFilter: function (sourceOrigin) {
            return this._allowOrigin === "*"
        },
        /**
         * @param  {object} param ajax 请求参数
         */
        _paramFilter: function (param) {
            return !!param && param.eventId
        },
        _sendMsg: function (msg, eventId, errMsg) {
            if (isTop) {
                return o._log("msg to parent: ", msg)
            }
            window.parent.postMessage(JSON.stringify({
                ajax_proxy: true,
                eventId: eventId,
                data: msg,
                error: errMsg
            }), '*')
        },
        _onMsg: function (e) {
            if (e.source !== window.parent) return
            var data;
            try {
                data = JSON.parse(e.data)
            } catch (e) {}
            if (data && data.ajax_proxy) { // 这个字段表明是 ajax proxy 的消息
                if (this._originFilter(e.origin) && this._paramFilter(data)) {
                    abort(data) || send(data)
                } else {
                    o._log("request illegal: ", data)
                }
            }
        },
        /**
         * @param  {function} originFilter 多个origin之间逗号分隔，协议+主机+端口号
         */
        setOriginFilter: function (originFilter) {
            this._originFilter = originFilter
        },
        setParamFilter: function (filter) {
            this._paramFilter = filter
        }
    }

    function init() {
        var method = 'addEventListener' in window ? "addEventListener" : "attachEvent";
        window[method]("message", function (e) {
            o._onMsg(e)
        })
    }

    window.onload = function (e) {
        init()
        o._sendMsg("_proxy_loaded_")
    }

    return o
})()