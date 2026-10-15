# CinemaHOT 本地品牌资源

导航与加载标记使用胶片卷图形；静态站点图标与导航使用同一图形语言，并沿用现有青色主题。

- `site/brand/Logo.tsx`：字标显示 CinemaHOT，胶片卷可作为加载动画。
- `site/brand/logo.svg`：512 × 512 矢量图标。
- `icon.png`、`icon-192.png`、`apple-icon.png`：512、192、180 像素图标。
- `favicon.ico`：32 像素 PNG 编码图标。
- `site/brand/nameplates/`：电影摄影日报、电影摄影周报、电影摄影月报、日报合订本的 SVG 报头。

重新生成报头：

```sh
node scripts/nameplates.ts
```

默认使用仓库已有的 Noto Sans SC Bold 字体，不需要网络下载或安装系统字体。字体仍遵循 `assets/og-fonts/LICENSE` 中的 SIL Open Font License。若传入 Fontsource Noto Sans SC 包目录，仍可按原来的方式生成 Black 字重报头。

修改矢量图标后，可通过项目现有 Sharp 依赖生成对应尺寸 PNG；ICO 包含相同图形的 32 像素 PNG。修改品牌资源后重新构建前端，以更新资源文件名及缓存。
