# 信源侦测

为新信源找到能长期自动采集的入口，再交给 `scripts/check-cinemahot-sources.ts` 联网验证。这里的工具只读公开页面，不写数据库、不调用模型、不使用付费服务。

| 文件 | 作用 |
|---|---|
| `probe.ts` | 侦测一个网址或 YouTube 频道：订阅（页面声明的和常见路径）、带日期的文章链接、页面内嵌数据、YouTube 频道 ID 与最近更新 |
| `loopback-proxy.mjs` | 只监听本机 `127.0.0.1:55435` 的转发代理，供本机联网验证和采集使用 |

## 流程

1. **侦测入口**，一次可以给多个：

   ```sh
   node scripts/source-discovery/probe.ts https://example.org/news @SomeChannel
   ```

   请求使用采集程序自己的 User-Agent，所以“网站拒绝采集程序”在这里就能看出来（HTTP 403/412）。按结果选读取方式，优先级：
   - **有订阅（feed）** → `rss`，填 `feedUrl`；
   - **HTML 里有带日期的文章链接** → `web_list`，写选择器（见 [信源配置](../../docs/sources.md#web_list)）；
   - **列表在内嵌数据里**（`__NEXT_DATA__`、`self.__next_f`、`window._ROUTER_DATA` 等）→ `json_list` 的 `html_json_key` 或 `html_window_var`；
   - **列表由脚本另外请求** → 用浏览器开发者工具的网络面板找接口，能直接访问的用 `json_list` 的 `json_api`；
   - **网站拒绝采集或没有日期** → 找它的官方 YouTube 频道（`@handle`），频道订阅自带日期。先确认是官方频道、仍在更新，冒名和多年不更新的频道不要用。
   - X（推特）账号可用 `x_search`，但要配置 SocialData 并按请求付费。

2. **写入配置**：同一 ID 与完整配置写进 `industry/sources.json`，ID 用小写字母、数字和连字符，按读取方式加前缀（`rss-`、`web-`、`json-`，YouTube 频道用 `rss-yt-`）。

3. **联网验证**：

   ```sh
   EGRESS_PROXY_URL=http://127.0.0.1:55435 node scripts/check-cinemahot-sources.ts --ids <新ID>
   ```

   通过的标准：能读到条目，且条目有可信发布时间。列表无日期、靠详情页补日期的来源，脚本会读前两条的详情页。

4. **记录**：在 [信源目录](../../docs/sources/catalog.md) 写明来源、ID、读取方式、入口和验证方式；接不上的写明原因。

## 本机转发代理

有的电脑上代理客户端（如 Clash 的 fake-IP 模式）会把海外域名解析成私网地址，被采集的 SSRF 检查拦下；同时它又拒绝 DNS-over-HTTPS 域名，项目设置 `EGRESS_PROXY_URL` 指向它也无法查询真实地址。这时启动本机转发代理：

```sh
node scripts/source-discovery/loopback-proxy.mjs
```

再把 `EGRESS_PROXY_URL=http://127.0.0.1:55435` 写进 `.env` 或加在命令前。项目仍自己通过代理查询真实地址并做地址检查，代理只按项目给的地址转发连接，不放宽任何安全检查。它只监听本机回环地址，不要改成对外监听；服务器能直接访问海外站点时不需要它。
