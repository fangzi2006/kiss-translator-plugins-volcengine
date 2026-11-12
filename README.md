# 简约翻译 · 火山机器翻译插件

简约翻译（Kiss-Translator）的独立接口插件，基于[火山引擎官方机器翻译开放 API（TranslateText）](https://docs.volcengine.com/docs/machine-translation/text-translation-api)，采用插件 API 1 规范开发。支持高并发多段落批量聚合翻译，内置标准 V4 签名认证算法。

[English](README.en.md) · [简约翻译主项目](https://github.com/fishjar/kiss-translator) · [插件开发指南](https://github.com/fishjar/kiss-translator-plugins/blob/main/docs/plugin-development-guide.md)

---

## 特性亮点

* **官方开放 API**：直连火山引擎开放平台（`translate.volcengineapi.com`），稳定高可用，每月享有官方赠送的免费翻译字符额度（200 万字符/月）。
* **多段批量聚合（Batch Translation）**：原生适配 Kiss-Translator 批处理机制，一次请求聚合翻译页面多个 DOM 文本段落，显著减少网络开销与页面白屏等待时间。
* **原生 V4 签名计算**：内置零依赖纯 JS 实现的 HMAC-SHA256 签名机制，自动生成合规的 `Authorization`、`X-Date` 和 `X-Content-Sha256` 请求头，完美兼容浏览器扩展与油猴脚本沙盒环境。
* **友好报错拦截**：精准拦截并展示火山引擎控制台返回的错误原因（如密钥错误、QPS 超限、账户欠费等）。

---

## 安装方法

本插件无需编译打包，仓库根目录即为标准插件结构，包含以下三种安装方式：

### 方式 1：导入本地文件夹（推荐本地测试）
1. 将本仓库克隆或下载到本地，解压得到包含 `manifest.json` 的文件夹。
2. 打开简约翻译设置页，进入 **「接口插件」** 标签页。
3. 点击 **「导入文件夹」**，选中该插件目录即可完成安装。

### 方式 2：在线导入 GitHub 仓库
1. 进入简约翻译设置页的 **「接口插件」**。
2. 在「GitHub 项目或 HTTPS ZIP 地址」输入框中填入本仓库地址并点击安装。

### 方式 3：打包 ZIP 导入
1. 将仓库根目录下的所有文件压缩为 `.zip` 文件（确保 `manifest.json` 位于压缩包的根层级）。
2. 在「接口插件」面板中点击 **「导入 ZIP」** 完成加载。

---

## 快速配置指引

1. **开通服务与获取密钥**：
   * 前往[火山引擎官网](https://www.volcengine.com/)注册并完成实名认证。
   * 进入控制台，搜索并开通 **“机器翻译”** 服务。
   * 打开 [访问控制 (IAM) - 密钥管理](https://console.volcengine.com/iam/keymanage/)，创建并复制你的 **AccessKey ID (AK)** 与 **Secret Access Key (SK)**。
2. **在简约翻译中创建服务实例**：
   * 进入简约翻译设置页 **「服务配置」** -> 点击右上角 **「添加」** -> 选择 **「插件接口」**。
   * 在服务列表中找到 **“火山文本翻译”** 并点击添加。
3. **填写参数并保存**：
   * **API 基础地址**：默认为 `https://translate.volcengineapi.com`（若有自建代理反代可按需修改）。
   * **AccessKey ID (AK)**：填入火山引擎生成的 AK。
   * **Secret Access Key (SK)**：填入对应的 SK。
   * **Region（地域）**：默认为 `cn-north-1`。
4. **运行测试**：
   * 在配置卡片下方点击能力测试，确认返回翻译成功。
   * 即可在“网页对照翻译”或“划词翻译”中选用该火山引擎实例！

---

## 目录结构

```text
kiss-translator-plugins-volcengine/
├── assets/
│   ├── logo-source.svg    # 矢量图标源文件
│   └── logo.png           # 插件图标 (PNG 格式)
├── services/
│   └── translate.js       # 核心翻译逻辑与 V4 签名实现
├── tests/
│   └── translate.test.cjs # 独立单元测试
├── manifest.json          # 插件清单声明
├── LICENSE                # MIT 开源许可证
└── README.md              # 中文说明文档
```

---

## 运行测试

如需在本地运行单元测试，进入插件目录执行：
```bash
node --test tests/translate.test.cjs
```
