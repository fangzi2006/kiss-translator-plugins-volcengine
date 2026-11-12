// 插件 API 1 实现：火山引擎官方机器翻译（TranslateText）
// 原生支持多段落批量聚合翻译，采用标准 V4 HMAC-SHA256 签名机制。

function mapTargetLanguage(lang) {
  if (!lang) return "zh";
  var l = String(lang).trim().toLowerCase();
  if (l === "zh-tw" || l === "zh-hk" || l === "zh-hant") return "zh-Hant";
  if (l === "zh" || l === "zh-cn" || l === "zh-hans") return "zh";
  return lang;
}

function mapSourceLanguage(lang) {
  if (!lang) return "";
  var l = String(lang).trim().toLowerCase();
  if (l === "auto" || l === "detect" || l === "und") return "";
  if (l === "zh-tw" || l === "zh-hk" || l === "zh-hant") return "zh-Hant";
  if (l === "zh" || l === "zh-cn" || l === "zh-hans") return "zh";
  return lang;
}

function utf8Encode(str) {
  if (typeof TextEncoder !== "undefined") {
    return new TextEncoder().encode(str);
  }
  var bytes = [];
  for (var i = 0; i < str.length; i++) {
    var c = str.charCodeAt(i);
    if (c < 0x80) {
      bytes.push(c);
    } else if (c < 0x800) {
      bytes.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
    } else if (c < 0xd800 || c >= 0xe000) {
      bytes.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
    } else {
      i++;
      c = 0x10000 + (((c & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
      bytes.push(
        0xf0 | (c >> 18),
        0x80 | ((c >> 12) & 0x3f),
        0x80 | ((c >> 6) & 0x3f),
        0x80 | (c & 0x3f)
      );
    }
  }
  return new Uint8Array(bytes);
}

var SHA256_K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

function sha256Bytes(data) {
  if (typeof data === "string") data = utf8Encode(data);
  var dataLen = data.length;
  var bitLenHi = Math.floor(dataLen / 0x20000000);
  var bitLenLo = (dataLen * 8) >>> 0;

  var padLen = dataLen % 64 < 56 ? 56 - (dataLen % 64) : 120 - (dataLen % 64);
  var totalLen = dataLen + padLen + 8;
  var padded = new Uint8Array(totalLen);
  padded.set(data);
  padded[dataLen] = 0x80;

  var view = new DataView(padded.buffer);
  view.setUint32(totalLen - 8, bitLenHi, false);
  view.setUint32(totalLen - 4, bitLenLo, false);

  var h0 = 0x6a09e667,
    h1 = 0xbb67ae85,
    h2 = 0x3c6ef372,
    h3 = 0xa54ff53a,
    h4 = 0x510e527f,
    h5 = 0x9b05688c,
    h6 = 0x1f83d9ab,
    h7 = 0x5be0cd19;

  var w = new Uint32Array(64);

  for (var offset = 0; offset < totalLen; offset += 64) {
    for (var i = 0; i < 16; i++) {
      w[i] = view.getUint32(offset + i * 4, false);
    }
    for (var i = 16; i < 64; i++) {
      var s0 =
        ((w[i - 15] >>> 7) | (w[i - 15] << 25)) ^
        ((w[i - 15] >>> 18) | (w[i - 15] << 14)) ^
        (w[i - 15] >>> 3);
      var s1 =
        ((w[i - 2] >>> 17) | (w[i - 2] << 15)) ^
        ((w[i - 2] >>> 19) | (w[i - 2] << 13)) ^
        (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }

    var a = h0,
      b = h1,
      c = h2,
      d = h3,
      e = h4,
      f = h5,
      g = h6,
      h = h7;

    for (var i = 0; i < 64; i++) {
      var S1 =
        ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
      var ch = (e & f) ^ (~e & g);
      var temp1 = (h + S1 + ch + SHA256_K[i] + w[i]) >>> 0;
      var S0 =
        ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
      var maj = (a & b) ^ (a & c) ^ (b & c);
      var temp2 = (S0 + maj) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
    h5 = (h5 + f) >>> 0;
    h6 = (h6 + g) >>> 0;
    h7 = (h7 + h) >>> 0;
  }

  var result = new Uint8Array(32);
  var resView = new DataView(result.buffer);
  resView.setUint32(0, h0, false);
  resView.setUint32(4, h1, false);
  resView.setUint32(8, h2, false);
  resView.setUint32(12, h3, false);
  resView.setUint32(16, h4, false);
  resView.setUint32(20, h5, false);
  resView.setUint32(24, h6, false);
  resView.setUint32(28, h7, false);
  return result;
}

function bytesToHex(bytes) {
  var hex = "";
  for (var i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, "0");
  }
  return hex;
}

function hmacSha256(key, message) {
  if (typeof key === "string") key = utf8Encode(key);
  if (typeof message === "string") message = utf8Encode(message);

  if (key.length > 64) {
    key = sha256Bytes(key);
  }
  var kPad = new Uint8Array(64);
  kPad.set(key);

  var oPad = new Uint8Array(64 + 32);
  var iPad = new Uint8Array(64 + message.length);

  for (var i = 0; i < 64; i++) {
    oPad[i] = kPad[i] ^ 0x5c;
    iPad[i] = kPad[i] ^ 0x36;
  }
  iPad.set(message, 64);
  var innerHash = sha256Bytes(iPad);
  oPad.set(innerHash, 64);
  return sha256Bytes(oPad);
}

exports.translate = async function (input, config, ctx) {
  if (!input || !Array.isArray(input.items) || !input.items.length) {
    return { items: [], sourceLanguage: input ? input.sourceLanguage : "" };
  }

  var ak = (config.accessKeyId || "").trim();
  var sk = (config.secretAccessKey || "").trim();
  if (!ak || !sk) {
    throw new Error("请在服务配置中填写 AccessKey ID 和 Secret Access Key");
  }

  var baseUrl = config.baseUrl || "https://translate.volcengineapi.com";
  var region = config.region || "cn-north-1";
  var service = "translate";

  var endpoint = new URL(baseUrl);
  endpoint.searchParams.set("Action", "TranslateText");
  endpoint.searchParams.set("Version", "2020-06-01");

  var targetLang = mapTargetLanguage(input.targetLanguage);
  var sourceLang = mapSourceLanguage(input.sourceLanguage);

  var texts = input.items.map(function (item) {
    return item.text;
  });

  var payloadObj = {
    SourceLanguage: sourceLang,
    TargetLanguage: targetLang,
    TextList: texts,
  };
  var bodyPayload = JSON.stringify(payloadObj);

  var now = new Date();
  var xDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  var shortDate = xDate.substring(0, 8);
  var bodySha256 = bytesToHex(sha256Bytes(bodyPayload));

  var host = endpoint.host;
  var canonicalQuery = Array.from(endpoint.searchParams.keys())
    .sort()
    .map(function (k) {
      return encodeURIComponent(k) + "=" + encodeURIComponent(endpoint.searchParams.get(k));
    })
    .join("&");

  var canonicalHeaders =
    "content-type:application/json\nhost:" +
    host +
    "\nx-content-sha256:" +
    bodySha256 +
    "\nx-date:" +
    xDate +
    "\n";
  var signedHeaders = "content-type;host;x-content-sha256;x-date";

  var canonicalRequest = [
    "POST",
    endpoint.pathname || "/",
    canonicalQuery,
    canonicalHeaders,
    signedHeaders,
    bodySha256,
  ].join("\n");

  var credentialScope = shortDate + "/" + region + "/" + service + "/request";
  var stringToSign = [
    "HMAC-SHA256",
    xDate,
    credentialScope,
    bytesToHex(sha256Bytes(canonicalRequest)),
  ].join("\n");

  var kDate = hmacSha256(sk, shortDate);
  var kRegion = hmacSha256(kDate, region);
  var kService = hmacSha256(kRegion, service);
  var kSigning = hmacSha256(kService, "request");

  var signature = bytesToHex(hmacSha256(kSigning, stringToSign));
  var authorization =
    "HMAC-SHA256 Credential=" +
    ak +
    "/" +
    credentialScope +
    ", SignedHeaders=" +
    signedHeaders +
    ", Signature=" +
    signature;

  var response = await ctx.http.request({
    url: endpoint.toString(),
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Date": xDate,
      "X-Content-Sha256": bodySha256,
      Authorization: authorization,
    },
    body: bodyPayload,
  });

  if (response.status < 200 || response.status >= 300) {
    var errMsg = "HTTP " + response.status;
    try {
      var errJson = JSON.parse(response.body);
      if (errJson && errJson.ResponseMetadata && errJson.ResponseMetadata.Error) {
        errMsg =
          "[" +
          errJson.ResponseMetadata.Error.Code +
          "] " +
          errJson.ResponseMetadata.Error.Message;
      }
    } catch (_) {}
    throw new Error("火山引擎翻译请求失败: " + errMsg);
  }

  var data = JSON.parse(response.body);
  if (data.ResponseMetadata && data.ResponseMetadata.Error) {
    throw new Error(
      "火山引擎 API 报错: [" +
        data.ResponseMetadata.Error.Code +
        "] " +
        data.ResponseMetadata.Error.Message
    );
  }

  var list = data.TranslationList || (data.Result && data.Result.TranslationList) || [];
  return {
    items: input.items.map(function (item, index) {
      return {
        id: item.id,
        text: list[index] ? list[index].Translation : item.text,
      };
    }),
    sourceLanguage:
      (list[0] && list[0].DetectedSourceLanguage) || input.sourceLanguage || "",
  };
};
