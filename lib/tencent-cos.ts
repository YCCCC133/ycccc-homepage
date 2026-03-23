import COS from "cos-nodejs-sdk-v5";

type CosEnv = {
  secretId: string;
  secretKey: string;
  region: string;
  bucket: string;
  appId: string;
};

type CosClient = ReturnType<typeof createClient>;

let cachedClient: COS | null = null;
let cachedEnv: CosEnv | null | undefined;

function readEnv(): CosEnv | null {
  if (cachedEnv !== undefined) {
    return cachedEnv;
  }

  const secretId = process.env.TENCENT_SECRET_ID || "";
  const secretKey = process.env.TENCENT_SECRET_KEY || "";
  const region = process.env.TENCENT_COS_REGION || "";
  const bucket = process.env.TENCENT_COS_BUCKET || "";
  const appId = process.env.TENCENT_COS_APP_ID || "";

  if (!secretId || !secretKey || !region || !bucket || !appId) {
    cachedEnv = null;
    return null;
  }

  cachedEnv = { secretId, secretKey, region, bucket, appId };
  return cachedEnv;
}

function createClient(env: CosEnv): COS {
  return new COS({
    SecretId: env.secretId,
    SecretKey: env.secretKey,
  });
}

function getClient(): { client: COS; env: CosEnv } | null {
  const env = readEnv();
  if (!env) {
    return null;
  }
  if (!cachedClient) {
    cachedClient = createClient(env);
  }
  return { client: cachedClient, env };
}

function getBucketName(env: CosEnv): string {
  return `${env.bucket}-${env.appId}`;
}

function normalizeBody(body: unknown): string {
  if (typeof body === "string") {
    return body;
  }
  if (Buffer.isBuffer(body)) {
    return body.toString("utf-8");
  }
  if (body instanceof ArrayBuffer) {
    return Buffer.from(body).toString("utf-8");
  }
  if (ArrayBuffer.isView(body)) {
    return Buffer.from(body.buffer).toString("utf-8");
  }
  return String(body ?? "");
}

async function withRetry<T>(fn: () => Promise<T>, retries = 1): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

export async function getJsonObject<T>(key: string): Promise<T | null> {
  const context = getClient();
  if (!context) {
    return null;
  }
  const { client, env } = context;
  const bucketName = getBucketName(env);

  return withRetry(
    () =>
      new Promise<T | null>((resolve, reject) => {
        client.getObject(
          {
            Bucket: bucketName,
            Region: env.region,
            Key: key,
          },
          (err, data) => {
            if (err) {
              const code = (err as { code?: string }).code;
              const status = (err as { statusCode?: number }).statusCode;
              if (code === "NoSuchKey" || status === 404) {
                resolve(null);
                return;
              }
              reject(err);
              return;
            }
            if (!data || !data.Body) {
              resolve(null);
              return;
            }
            try {
              const text = normalizeBody(data.Body);
              if (!text) {
                resolve(null);
                return;
              }
              resolve(JSON.parse(text) as T);
            } catch (parseError) {
              reject(parseError);
            }
          }
        );
      }),
    1
  );
}

export async function putJsonObject<T>(key: string, value: T): Promise<void> {
  const context = getClient();
  if (!context) {
    return;
  }
  const { client, env } = context;
  const bucketName = getBucketName(env);
  const body = Buffer.from(JSON.stringify(value, null, 2), "utf-8");

  await withRetry(
    () =>
      new Promise<void>((resolve, reject) => {
        client.putObject(
          {
            Bucket: bucketName,
            Region: env.region,
            Key: key,
            Body: body,
            ContentType: "application/json",
          },
          (err) => {
            if (err) {
              reject(err);
              return;
            }
            resolve();
          }
        );
      }),
    1
  );
}

export function hasCosConfig(): boolean {
  return Boolean(readEnv());
}
