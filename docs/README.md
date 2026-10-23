# CineHOT 文档导航

版本 **v0.1.0**。日常使用先看部署、信源管理与运行维护；框架原理和高级配置保留在下方参考文档中。

| 文件夹 | 内容 |
|---|---|
| [deployment/](deployment/README.md) | 逐步服务器部署手册、首次部署、本机启动、校园访问 |
| [sources/](sources/README.md) | 后台信源管理、当前名单与适配依据 |
| [operations/](operations/README.md) | 模型配置、请求预算、费用观察、常见问题 |
| [quality/](quality/calibration.md) | 101 条真实文章待标注清单及精选校准 |
| [branding/](branding/README.md) | 上传 Logo 与品牌资源 |
| [releases/](releases/README.md) | 版本号、发布记录与升级注意事项 |

## 开发参考

- [完整部署、更新和备份](deploy.md)
- [完整信源配置规则](sources.md)
- [架构](architecture.md)
- [定制站点](customize.md)
- [精选评测](selection.md)
- [归组](grouping.md)
- [事件综述评测](story-digest-evaluation.md)

仓库保存代码和可复用配置。本机密钥、数据库、文章数据及标注工作文件存放在各自运行环境，不随 GitHub 同步。站内更新日志在 `site/changelog.json`；本项目版本号以根目录 `VERSION` 为准，接口版本独立维护。
