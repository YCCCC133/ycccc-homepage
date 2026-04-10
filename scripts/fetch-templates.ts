import { FetchClient, Config } from 'coze-coding-dev-sdk';

const config = new Config();
const client = new FetchClient(config);

const urls = [
  {
    name: '劳动争议纠纷-民事起诉状模板（2025版）',
    url: 'https://code.coze.cn/api/sandbox/coze_coding/file/proxy?expire_time=-1&file_path=assets%2F%E5%8A%B3%E5%8A%A8%E4%BA%89%E8%AE%AE%E7%BA%A0%E7%BA%B7-%E6%B0%91%E4%BA%8B%E8%B5%B7%E8%AF%89%E7%8A%B6%E6%A8%A1%E6%9D%BF%EF%BC%882025%E7%89%88%EF%BC%89.docx&nonce=a6961f9b-6ced-4a0a-a3e4-50fb0977d655&project_id=7625157620592181302&sign=740a5b04053fc3ede30f8424d691c95d2a2ec9aa2ac6b8b60c9207bbe97b7525'
  },
  {
    name: '劳务合同纠纷-民事起诉状模板',
    url: 'https://code.coze.cn/api/sandbox/coze_coding/file/proxy?expire_time=-1&file_path=assets%2F%E5%8A%B3%E5%8A%A1%E5%90%88%E5%90%8C%E7%BA%A0%E7%BA%B7-%E6%B0%91%E4%BA%8B%E8%B5%B7%E8%AF%89%E7%8A%B6%E6%A8%A1%E6%9D%BF.docx&nonce=905fc7a8-5258-4066-ab1e-45c4d04c9108&project_id=7625157620592181302&sign=55af86fcc9426aa515ddffb3dc5325b969c40d770c74b48379afa91afa00884b'
  },
  {
    name: '支持起诉-信息填写',
    url: 'https://code.coze.cn/api/sandbox/coze_coding/file/proxy?expire_time=-1&file_path=assets%2F%E6%94%AF%E6%8C%81%E8%B5%B7%E8%AF%89-%E4%BF%A1%E6%81%AF%E5%A1%AB%E5%86%99.docx&nonce=91fb31a4-a455-4244-8c46-4d56e2083a18&project_id=7625157620592181302&sign=233e14667c6f9d9f29b44ff476d4130311ddfe37920d59922e8fc24b4395154c'
  },
  {
    name: '支持起诉书模板',
    url: 'https://code.coze.cn/api/sandbox/coze_coding/file/proxy?expire_time=-1&file_path=assets%2F%E6%94%AF%E6%8C%81%E8%B5%B7%E8%AF%89%E4%B9%A6%E6%A8%A1%E6%9D%BF.wps&nonce=9be2acbd-767b-4032-8315-4f815ce7e3e4&project_id=7625157620592181302&sign=dc911325098d1f8b7f677b8b51a519965a440c6a7e45c2e39815bfb22e6f82dc'
  }
];

async function fetchDocuments() {
  for (const doc of urls) {
    console.log(`\n=== ${doc.name} ===`);
    try {
      const response = await client.fetch(doc.url);
      console.log(`Status: ${response.status_code === 0 ? 'Success' : 'Failed'}`);
      console.log(`File Type: ${response.filetype}`);
      
      const textContent = response.content
        .filter(item => item.type === 'text')
        .map(item => item.text)
        .join('\n');
      
      console.log(`\n--- Content Preview ---`);
      console.log(textContent.substring(0, 2000));
      if (textContent.length > 2000) {
        console.log(`\n... [${textContent.length - 2000} more characters]`);
      }
    } catch (error) {
      console.error(`Error fetching ${doc.name}:`, error);
    }
  }
}

fetchDocuments();
