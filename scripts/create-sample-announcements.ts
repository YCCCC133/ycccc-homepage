import { S3Storage } from 'coze-coding-dev-sdk';
import { getSupabaseClient } from '../src/storage/database/supabase-client';
import { readFile } from 'fs/promises';
import { join } from 'path';

// 初始化存储
const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: '',
  secretKey: '',
  bucketName: process.env.COZE_BUCKET_NAME,
  region: 'cn-beijing',
});

// 公告数据
const announcements = [
  {
    title: '关于开展农民工工资支付专项检查的通知',
    content: '为切实保障农民工合法权益，根据《保障农民工工资支付条例》要求，现决定在全市范围内开展农民工工资支付专项检查行动。请各用人单位和施工企业自查自纠，确保工资按时足额发放。对于拖欠工资的企业，将依法予以严肃处理。',
    category: '政策通知',
    image_url: '',
    is_top: true,
    is_banner: true,
    is_published: true,
    sort_order: 1,
  },
  {
    title: '护薪平台新增在线法律援助功能',
    content: '为更好地服务农民工群体，护薪平台现已开通在线法律援助功能。劳动者可通过平台直接联系专业律师，获取免费法律咨询和指导服务。平台汇聚了一批具有丰富经验的劳动法律师，为您解答各类劳动权益问题。',
    category: '平台公告',
    image_url: '',
    is_top: false,
    is_banner: true,
    is_published: true,
    sort_order: 2,
  },
  {
    title: '关于规范劳动仲裁申请材料的通知',
    content: '为提高劳动争议处理效率，现将劳动仲裁申请材料的规范化要求予以明确。请申请人在提交仲裁申请时，按照要求准备相关材料，确保案件及时受理。具体材料清单请参阅附件或联系平台客服。',
    category: '办事指南',
    image_url: '',
    is_top: false,
    is_banner: true,
    is_published: true,
    sort_order: 3,
  },
  {
    title: '2025年第一季度欠薪案件处理情况通报',
    content: '本季度全市共处理欠薪案件XX起，为XX名劳动者追回工资款XX万元。各区县各部门高度重视，通过协调、调解、仲裁等方式，有效化解了大量劳动争议。典型案例包括...',
    category: '工作动态',
    image_url: '',
    is_top: false,
    is_banner: false,
    is_published: true,
    sort_order: 4,
  },
  {
    title: '劳动权益保护法律知识问答',
    content: '为帮助广大劳动者了解自身权益，现推出系列法律知识问答。本期聚焦：劳动合同签订、工资支付、工伤认定等常见问题。了解更多法律知识，请访问平台法律知识库。',
    category: '普法宣传',
    image_url: '',
    is_top: false,
    is_banner: false,
    is_published: true,
    sort_order: 5,
  },
];

async function uploadLocalImage(filepath: string, filename: string): Promise<string> {
  try {
    console.log(`正在读取本地文件: ${filepath}...`);
    const fileBuffer = await readFile(filepath);
    
    console.log(`正在上传: ${filename}...`);
    const key = await storage.uploadFile({
      fileContent: fileBuffer,
      fileName: `announcements/${filename}`,
      contentType: 'image/jpeg',
    });
    
    // 生成永久访问URL
    const signedUrl = await storage.generatePresignedUrl({
      key: key,
      expireTime: 31536000, // 1年
    });
    
    console.log(`上传成功: ${filename}`);
    return signedUrl;
  } catch (error) {
    console.error(`处理图片失败 ${filepath}:`, error);
    throw error;
  }
}

async function createAnnouncements(imageUrls: (string | null)[]) {
  const supabase = getSupabaseClient();
  
  for (let i = 0; i < announcements.length; i++) {
    const announcement = announcements[i];
    
    // 为Banner类型的公告分配图片
    if (announcement.is_banner && imageUrls[i]) {
      announcement.image_url = imageUrls[i];
    }
    
    try {
      console.log(`正在创建公告: ${announcement.title}`);
      
      const { data, error } = await supabase
        .from('announcements')
        .insert({
          title: announcement.title,
          content: announcement.content,
          category: announcement.category,
          image_url: announcement.image_url || null,
          is_top: announcement.is_top,
          is_banner: announcement.is_banner,
          is_published: announcement.is_published,
          sort_order: announcement.sort_order,
        })
        .select()
        .single();
      
      if (error) {
        console.error(`创建公告失败: ${announcement.title}`, error);
      } else {
        console.log(`公告创建成功: ${announcement.title}, ID: ${data.id}`);
      }
    } catch (error) {
      console.error(`创建公告时出错: ${announcement.title}`, error);
    }
  }
}

async function main() {
  const basePath = process.cwd();
  
  // 本地图片路径
  const localImages = [
    join(basePath, 'public/temp/banner_1.jpeg'),
    join(basePath, 'public/temp/banner_2.jpeg'),
    join(basePath, 'public/temp/banner_3.jpeg'),
  ];
  
  console.log('开始上传Banner图片...');
  
  try {
    const imageUrls: (string | null)[] = [];
    
    // 上传Banner图片
    for (let i = 0; i < localImages.length; i++) {
      const url = await uploadLocalImage(
        localImages[i], 
        `banner_${i + 1}.jpeg`
      );
      imageUrls.push(url);
    }
    
    // 非Banner公告不需要图片
    imageUrls.push(null);
    imageUrls.push(null);
    
    console.log('\n所有图片处理完成！');
    console.log('Banner图片URLs:', imageUrls.slice(0, 3));
    
    console.log('\n开始创建公告记录...');
    await createAnnouncements(imageUrls);
    
    console.log('\n全部完成！共创建', announcements.length, '条公告');
  } catch (error) {
    console.error('执行失败:', error);
    process.exit(1);
  }
}

main();
