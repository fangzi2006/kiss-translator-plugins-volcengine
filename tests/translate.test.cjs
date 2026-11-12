const test = require("node:test");
const assert = require("node:assert/strict");
const { translate } = require("../services/translate.js");

test("translate validates AK and SK configuration", async () => {
  await assert.rejects(
    async () => {
      await translate(
        { items: [{ id: "0", text: "hello" }], sourceLanguage: "en", targetLanguage: "zh" },
        { accessKeyId: "", secretAccessKey: "" },
        {}
      );
    },
    /请在服务配置中填写 AccessKey ID 和 Secret Access Key/
  );
});

test("translate constructs signed request and parses TranslationList", async () => {
  let capturedRequest = null;
  const mockCtx = {
    http: {
      request: async (req) => {
        capturedRequest = req;
        return {
          status: 200,
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            ResponseMetadata: {
              RequestId: "20261112220000",
              Action: "TranslateText",
              Version: "2020-06-01",
              Service: "translate",
              Region: "cn-north-1",
            },
            TranslationList: [
              { Translation: "你好", DetectedSourceLanguage: "en" },
              { Translation: "世界", DetectedSourceLanguage: "en" },
            ],
          }),
        };
      },
    },
  };

  const input = {
    items: [
      { id: "p1", text: "hello" },
      { id: "p2", text: "world" },
    ],
    sourceLanguage: "auto",
    targetLanguage: "zh-CN",
  };

  const config = {
    baseUrl: "https://translate.volcengineapi.com",
    accessKeyId: "TEST_AK_123456",
    secretAccessKey: "TEST_SK_654321",
    region: "cn-north-1",
  };

  const res = await translate(input, config, mockCtx);

  assert.equal(res.items.length, 2);
  assert.equal(res.items[0].id, "p1");
  assert.equal(res.items[0].text, "你好");
  assert.equal(res.items[1].id, "p2");
  assert.equal(res.items[1].text, "世界");
  assert.equal(res.sourceLanguage, "en");

  // Verify HTTP request details
  assert.ok(capturedRequest);
  assert.equal(
    capturedRequest.url,
    "https://translate.volcengineapi.com/?Action=TranslateText&Version=2020-06-01"
  );
  assert.equal(capturedRequest.method, "POST");
  assert.equal(capturedRequest.headers["Content-Type"], "application/json");
  assert.match(capturedRequest.headers["X-Date"], /^\d{8}T\d{6}Z$/);
  assert.match(capturedRequest.headers["X-Content-Sha256"], /^[0-9a-f]{64}$/);
  assert.match(
    capturedRequest.headers["Authorization"],
    /^HMAC-SHA256 Credential=TEST_AK_123456\/\d{8}\/cn-north-1\/translate\/request, SignedHeaders=content-type;host;x-content-sha256;x-date, Signature=[0-9a-f]{64}$/
  );

  const parsedBody = JSON.parse(capturedRequest.body);
  assert.equal(parsedBody.SourceLanguage, "");
  assert.equal(parsedBody.TargetLanguage, "zh");
  assert.deepEqual(parsedBody.TextList, ["hello", "world"]);
});

test("translate handles API error responses gracefully", async () => {
  const mockCtx = {
    http: {
      request: async () => {
        return {
          status: 400,
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            ResponseMetadata: {
              Error: {
                Code: "InvalidAccessKeyId",
                Message: "The Access Key ID does not exist.",
              },
            },
          }),
        };
      },
    },
  };

  await assert.rejects(
    async () => {
      await translate(
        { items: [{ id: "0", text: "test" }] },
        { accessKeyId: "BAD_AK", secretAccessKey: "BAD_SK" },
        mockCtx
      );
    },
    /火山引擎翻译请求失败: \[InvalidAccessKeyId\] The Access Key ID does not exist\./
  );
});
