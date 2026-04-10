import { S3Storage } from 'coze-coding-dev-sdk';

// 创建 S3Storage 单例
let storageInstance: S3Storage | null = null;

export function getS3Storage(): S3Storage {
  if (!storageInstance) {
    storageInstance = new S3Storage({
      endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
      accessKey: '',
      secretKey: '',
      bucketName: process.env.COZE_BUCKET_NAME,
      region: 'cn-beijing',
    });
  }
  return storageInstance;
}

/**
 * 上传文书到对象存储
 * @param content 文书内容
 * @param fileName 文件名
 * @returns 文件key和签名URL
 */
export async function uploadDocument(
  content: string,
  fileName: string
): Promise<{ key: string; url: string }> {
  const storage = getS3Storage();
  
  // 清理文件名
  const safeFileName = fileName.replace(/[^\w\u4e00-\u9fa5.-]/g, '_');
  
  // 将内容转换为Buffer
  const buffer = Buffer.from(content, 'utf-8');
  
  // 上传文件
  const key = await storage.uploadFile({
    fileContent: buffer,
    fileName: `documents/${safeFileName}`,
    contentType: 'text/plain;charset=utf-8',
  });
  
  // 生成签名URL（7天有效期）
  const url = await storage.generatePresignedUrl({
    key,
    expireTime: 7 * 24 * 60 * 60,
  });
  
  return { key, url };
}

/**
 * 获取文书下载URL
 * @param key 文件key
 * @param expireTime 有效期（秒），默认7天
 */
export async function getDocumentUrl(
  key: string,
  expireTime: number = 7 * 24 * 60 * 60
): Promise<string> {
  const storage = getS3Storage();
  return storage.generatePresignedUrl({
    key,
    expireTime,
  });
}

/**
 * 删除文书文件
 * @param key 文件key
 */
export async function deleteDocument(key: string): Promise<boolean> {
  const storage = getS3Storage();
  return storage.deleteFile({ fileKey: key });
}

/**
 * 检查文件是否存在
 * @param key 文件key
 */
export async function checkFileExists(key: string): Promise<boolean> {
  const storage = getS3Storage();
  return storage.fileExists({ fileKey: key });
}
