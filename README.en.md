# Kiss-Translator · Volcengine Machine Translation Plugin

Standalone translation interface plugin for [Kiss-Translator](https://github.com/fishjar/kiss-translator), based on the official [Volcengine Text Translation API (TranslateText)](https://docs.volcengine.com/docs/machine-translation/text-translation-api) and adhering to the Kiss-Translator Plugin API 1 specification. Supports high-performance multi-paragraph batch translation with built-in standard V4 HMAC-SHA256 request signing.

[简体中文](README.md) · [Kiss-Translator Repository](https://github.com/fishjar/kiss-translator) · [Plugin Development Guide](https://github.com/fishjar/kiss-translator-plugins/blob/main/docs/plugin-development-guide.md)

---

## Features

* **Official Volcengine OpenAPI**: Connects directly to `translate.volcengineapi.com`, offering high stability, low latency, and 2 million free translation characters every month.
* **Batch Translation**: Native support for Kiss-Translator batch queues, translating multiple DOM text segments in a single network request.
* **Built-in Pure-JS V4 Signing**: Self-contained HMAC-SHA256 signature generator without external native dependencies, compatible with extension service workers and userscript sandboxes.
* **Clear Error Handling**: Automatically decodes and presents detailed API error messages from Volcengine ResponseMetadata.

---

## Installation

No compilation or build step required. The repository root is a standard ready-to-use plugin package:

### Method 1: Import Local Folder
1. Clone or download this repository locally.
2. In Kiss-Translator Settings, go to **Interface Plugins (接口插件)**.
3. Click **Import Folder (导入文件夹)** and select the directory containing `manifest.json`.

### Method 2: Import via GitHub URL (Recommended)
1. In Kiss-Translator Settings -> **Interface Plugins (接口插件)**.
2. Enter the repository URL into the **GitHub project or HTTPS ZIP URL** field:
   ```text
   https://github.com/fangzi2006/kiss-translator-plugins-volcengine
   ```
3. Click **Install (安装)**.

### Method 3: Import ZIP
1. Compress all files in the plugin root into a `.zip` archive (ensure `manifest.json` is at the zip root).
2. Click **Import ZIP** in the **Interface Plugins** panel.

---

## Configuration

1. **Get Credentials**:
   * Register on [Volcengine](https://www.volcengine.com/) and complete verification.
   * Enable the **Machine Translation (机器翻译)** service in the console.
   * Go to [IAM - Access Key Management](https://console.volcengine.com/iam/keymanage/) to create your **AccessKey ID (AK)** and **Secret Access Key (SK)**.
2. **Add Service Instance in Kiss-Translator**:
   * Go to **Service Configuration (服务配置)** -> Click **Add (添加)** -> Choose **Plugin Interface (插件接口)**.
   * Select **Volcengine Machine Translation (火山机器翻译)**.
3. **Configure Settings**:
   * **API Base URL**: `https://translate.volcengineapi.com`
   * **AccessKey ID (AK)**: Your AccessKey ID
   * **Secret Access Key (SK)**: Your Secret Access Key
   * **Region**: `cn-north-1` (default)
4. **Test and Use**:
   * Click the capability test at the bottom of the service card to verify connectivity.
   * Select this service instance for web page or selection translation!
