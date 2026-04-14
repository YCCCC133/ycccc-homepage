import { S3Storage } from "coze-coding-dev-sdk";
import { readFileSync } from "fs";

const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: "",
  secretKey: "",
  bucketName: process.env.COZE_BUCKET_NAME,
  region: "cn-beijing",
});

async function main() {
  const filePath = "/tmp/智能咨询数据源收集.xlsx";
  const fileContent = readFileSync(filePath);
  
  console.log("Uploading Excel file to storage...");
  
  const key = await storage.uploadFile({
    fileContent: fileContent,
    fileName: "knowledge/智能咨询数据源.xlsx",
    contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  
  console.log("File uploaded successfully!");
  console.log("Storage key:", key);
  
  // Generate a presigned URL for verification
  const url = await storage.generatePresignedUrl({
    key: key,
    expireTime: 86400 * 30, // 30 days
  });
  
  console.log("Download URL:", url);
}

main().catch(console.error);
