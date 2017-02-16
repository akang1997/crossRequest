# cross Request
fix cross domain request in browser without change server config

适用场景：
- 有浏览器跨域ajax请求的需求
- 目标服务器端没有跨域支持(Access-Control-Allow-Origin, JSONP...)
- 小程序员没有权限动服务器配置，大boss又要维稳，so...

通过在目标服务器丢一个静态html，一个静态js文件的方式，实现在`避免修改服务器端的原生代码与配置`的情况下，在前端完成跨域请求

技术原理：

1.  通过在浏览器主页面(parent window)通过 iframe 加载目标服务器上的 proxy html(proxy window) 
2.  需要发送跨域请求时，通过 html5 的 postMessage API 进行跨域跨窗口的消息传递，将 parent window 的 ajax 请求参数传递个 proxy window
3.  proxy window 收到请求参数之后，发送 ajax 请求给服务器，并将请求结果通过 postMessage API 回传给 parent window
4.  通过eventId标识每一个请求

安全问题：

proxy window 可以通过过滤 message origin 和 请求参数，来实现跨域访问控制

Tips:

代码中使用了 JSON.stringify 和 JSON.parse, 这个根据运行环境判断是否需要引入 json3.js

Supports：

IE  |  Edge | Firefox | Chrome | Safari | IOS | Android |
----|-------|---------|--------|--------|-----|---------|
8+  |  12+  | 3+      | 4+     | 4+     | 4+  |  2.1+   |
