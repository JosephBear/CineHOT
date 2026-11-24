# CineHOT 文档导航

日常使用先看部署、信源管理与运行维护；框架原理和高级配置在下方参考文档里。当前版本以根目录 `VERSION` 为准。

| 文件夹 | 内容 |
|---|---|
| [deployment/](deployment/README.md) | 部署与升级（Oracle 主站）、本机启动、校园镜像 |
| [sources/](sources/README.md) | 后台信源管理、当前名单、评审记录与适配依据 |
| [operations/](operations/README.md) | 当前运行方式、站外探测、模型预算与费用、常见问题 |
| [quality/](quality/calibration.md) | 人工标注与精选校准（两轮） |
| [education/](education/roster-research.md) | 影像教育单元的院校调研 |
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

仓库保存代码和可复用配置。服务器密钥、数据库、文章数据及标注工作文件存放在各自运行环境，不随 GitHub 同步。站内更新日志在 `site/changelog.json`；项目版本号以根目录 `VERSION` 为准，接口版本独立维护。
