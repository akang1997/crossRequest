// simulate query ajax api
var crossAjax = (function () {
    var o = {
        _map: {},
        _idCounter: 0,
        _proxyWin: null,
        _log: function () {
            console.log.apply(console, arguments)
        },
        // return eventId for this msg
        _sendMsg: function (cfg) {
            if (!this._proxyWin) return this._log('null proxy window')
            if (!cfg) return
            cfg.ajax_proxy = true
            if (!cfg.eventId) cfg.eventId = "evt" + ++this._idCounter
            this._proxyWin.postMessage(JSON.stringify(cfg), "*")
            return cfg.eventId
        },
        setProxyWindow: function (win) {
            if (win.tagName === "IFRAME") win = win.contentWindow
            this._proxyWin = win
        },
        send: function (cfg) {
            var d = $.Deferred(),
                id = this._sendMsg(cfg)
            this._map[id] = d
            d._eventId = id;
            d._cfg = cfg
            return d.promise()
        },
        abort: function (p) {
            this._sendMsg({
                eventId: p._eventId,
                type: "abort"
            })
        },
        _onMsg: function (e) {
            var data;
            try {
                data = JSON.parse(e.data)
            } catch (e) {}
            if (data && data.ajax_proxy) { // 这个字段表明是 ajax proxy 的消息
                var id = data.eventId;
                if (id) {
                    var d = o._map[id];
                    delete o._map[id]; // TODO
                    var cfg = d._cfg
                    if (data.data) { // success
                        safeRun(function () {
                            d.resolve(data.data)
                            cfg.success && cfg.success(data.data) // 
                        })
                    } else if (data.error) { // error
                        safeRun(function () {
                            d.reject(cfg.error)
                            cfg.error && cfg.error(data.error) // TODO
                        })
                    } else {

                    }

                    // complete
                    safeRun(function () {
                        cfg.complete && cfg.complete()
                    })
                }
            }
        }
    }

    function safeRun(fn) {
        try {
            fn()
        } catch (e) {
            console.log(e)
        }
    }

    function init() {
        var method = 'addEventListener' in window ? "addEventListener" : "attachEvent";
        window[method]("message", function (e) {
            o._onMsg(e)
        })
    }
    init()

    return o;
})();