# CineHOT 校园镜像

2026-10-24 起的分工：**AWS VPS 是主站**，负责采集、模型处理和全部数据；**校园服务器只做镜像**，不运行程序和数据库，只用 Nginx 把校内访问转发到主站并缓存公开页面。这样校园服务器不需要跟着升级版本，也不会出现两边同时采集。

## 配置

1. 在校园服务器上停掉 CineHOT 的全部容器（不再采集；数据库是否保留按当次升级说明）。
2. 把 [Nginx 镜像模板](../../deploy/campus/nginx.conf.example) 放进 `/etc/nginx/conf.d/`，替换监听端口、访问名单（模板里的 `192.0.2.0/24` 只是文档示例，要换成信息中心确认的校园网段）和主站地址。
3. `sudo nginx -t && sudo systemctl reload nginx`，从校内打开首页，响应头 `X-Mirror-Cache` 为 `MISS` 后再刷新应变为 `HIT`。

公开页面最多比主站晚 5 分钟；主站出错或连不上时继续提供缓存的旧页面（保留 7 天）。后台和登录路径在镜像上一律 404，后台只经 SSH 隧道在 VPS 上使用。

## 网络前提

校园服务器访问外网要先通过学校 Dr.COM 网页登录；服务器重启后登录失效，转发会失败（只剩缓存）。重启后先重新登录，再检查首页。

先请信息中心确认服务器的固定 IP、校园域名与证书，以及哪些校园网段能访问它，再定访问名单。

参考：[Nginx 反向代理缓存](https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_cache)、[按 IP 和 CIDR 控制访问](https://nginx.org/en/docs/http/ngx_http_access_module.html)。
