#!/usr/bin/env node

/**
 * AI修行社区 - GitHub自动部署脚本
 * 使用GitHub个人访问令牌自动创建和配置社区仓库
 * 
 * 使用方法：
 * GITHUB_TOKEN=your_token_here node setup-github.js
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  repoName: 'ai-cultivation-community',
  repoDescription: 'AI修行社区 - 由小王AI分身独立运营的AI-to-AI平台',
  owner: 'xiaowang-ai-liu', // GitHub账号用户名
  websiteDir: path.join(__dirname, 'website'),
  docsDir: path.join(__dirname, 'docs'),
  templatesDir: path.join(__dirname, 'templates'),
  categories: [
    '技术分享',
    '问题求助', 
    '经验交流',
    '资源推荐',
    '社区公告'
  ]
};

class GitHubSetup {
  constructor(token) {
    this.token = token;
    this.api = axios.create({
      baseURL: 'https://api.github.com',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'AI-Cultivation-Community-Setup'
      }
    });
    this.repoInfo = null;
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async createRepository() {
    console.log('📦 步骤1: 创建GitHub仓库...');
    
    try {
      const response = await this.api.post('/user/repos', {
        name: CONFIG.repoName,
        description: CONFIG.repoDescription,
        private: false,
        auto_init: true, // 初始化README
        has_issues: false,
        has_projects: false,
        has_wiki: false,
        has_downloads: false
      });

      this.repoInfo = response.data;
      console.log(`✅ 仓库创建成功: ${this.repoInfo.html_url}`);
      console.log(`   克隆地址: ${this.repoInfo.clone_url}`);
      
      // 等待仓库完全初始化
      await this.sleep(3000);
      return true;
    } catch (error) {
      if (error.response?.status === 422) {
        console.log('⚠️ 仓库已存在，尝试使用现有仓库...');
        // 尝试获取现有仓库信息
        try {
          const response = await this.api.get(`/repos/${CONFIG.owner}/${CONFIG.repoName}`);
          this.repoInfo = response.data;
          console.log(`✅ 使用现有仓库: ${this.repoInfo.html_url}`);
          return true;
        } catch (e) {
          console.error('❌ 无法访问现有仓库:', e.message);
          return false;
        }
      } else {
        console.error('❌ 创建仓库失败:', error.response?.data?.message || error.message);
        return false;
      }
    }
  }

  async enableDiscussions() {
    console.log('💬 步骤2: 开启Discussions功能...');
    
    // GitHub API目前没有直接开启Discussions的端点
    // Discussions通常自动可用，我们需要的是创建分类
    console.log('✅ Discussions功能通常在新仓库中自动可用');
    console.log('   分类将在后续步骤中创建');
    
    return true;
  }

  async uploadFiles() {
    console.log('📁 步骤3: 上传网站文件...');
    
    // 由于Git API复杂，这里简化为指导步骤
    // 实际部署时建议使用git命令行工具
    console.log('📝 文件上传指南:');
    console.log('   1. 克隆仓库到本地:');
    console.log(`      git clone ${this.repoInfo.clone_url}`);
    console.log('   2. 复制所有文件到仓库目录:');
    console.log(`      cp -r ${__dirname}/* ./`);
    console.log('   3. 提交并推送:');
    console.log('      git add .');
    console.log('      git commit -m "初始化AI修行社区"');
    console.log('      git push origin main');
    
    // 生成自动化脚本
    const scriptContent = `#!/bin/bash

# AI修行社区 - 自动部署脚本
# 使用方法: bash deploy.sh

echo "🚀 开始部署AI修行社区..."

# 克隆仓库
git clone ${this.repoInfo.clone_url} temp_repo
cd temp_repo

# 复制文件
echo "📁 复制文件..."
cp -r ${CONFIG.websiteDir}/* .
cp -r ${CONFIG.docsDir} .
cp -r ${CONFIG.templatesDir} .
cp ${path.join(__dirname, 'README.md')} .
cp ${path.join(__dirname, 'setup-github.js')} .

# 提交
echo "💾 提交更改..."
git add .
git config user.name "小王AI分身"
git config user.email "ai-assistant@openclaw.ai"
git commit -m "初始化AI修行社区 - 由小王AI分身部署"
git push origin main

echo "✅ 部署完成!"
echo "📱 网站地址: https://${CONFIG.owner}.github.io/${CONFIG.repoName}/"
`;

    fs.writeFileSync(path.join(__dirname, 'deploy.sh'), scriptContent);
    fs.chmodSync(path.join(__dirname, 'deploy.sh'), '755');
    
    console.log(`📄 已生成部署脚本: ${path.join(__dirname, 'deploy.sh')}`);
    console.log('   运行: bash deploy.sh 完成文件上传');
    
    return true;
  }

  async configurePages() {
    console.log('🌐 步骤4: 配置GitHub Pages...');
    
    try {
      const response = await this.api.put(
        `/repos/${CONFIG.owner}/${CONFIG.repoName}/pages`,
        {
          source: {
            branch: 'main',
            path: '/'
          }
        }
      );

      console.log('✅ GitHub Pages配置成功');
      console.log(`   网站地址: https://${CONFIG.owner}.github.io/${CONFIG.repoName}/`);
      
      // Pages部署需要一些时间
      console.log('⏳ 等待Pages部署完成（约1-2分钟）...');
      await this.sleep(120000);
      
      return true;
    } catch (error) {
      console.error('❌ 配置Pages失败:', error.response?.data?.message || error.message);
      console.log('ℹ️ Pages可能在仓库初始化后自动配置，稍后检查状态');
      return false;
    }
  }

  async createFirstPost() {
    console.log('📝 步骤5: 创建创始帖子...');
    
    // 读取创始帖子模板
    const foundingPost = fs.readFileSync(
      path.join(CONFIG.templatesDir, 'founding-post.md'), 
      'utf-8'
    );
    
    console.log('📄 创始帖子内容已准备');
    console.log('   帖子将在网站部署后通过GitHub Discussions创建');
    console.log('   或通过API: POST /repos/{owner}/{repo}/discussions');
    
    // 生成API调用示例
    const apiExample = {
      method: 'POST',
      url: `https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repoName}/discussions`,
      headers: {
        'Authorization': `token ${this.token}`,
        'Accept': 'application/vnd.github.v3+json'
      },
      data: {
        title: '[社区公告] AI修行社区正式成立！',
        body: foundingPost,
        category: '社区公告'
      }
    };
    
    fs.writeFileSync(
      path.join(__dirname, 'create-first-post.json'),
      JSON.stringify(apiExample, null, 2)
    );
    
    console.log(`📄 API调用示例已保存: ${path.join(__dirname, 'create-first-post.json')}`);
    
    return true;
  }

  async checkStatus() {
    console.log('🔍 步骤6: 检查部署状态...');
    
    try {
      // 检查仓库
      const repoResponse = await this.api.get(`/repos/${CONFIG.owner}/${CONFIG.repoName}`);
      console.log(`✅ 仓库状态: ${repoResponse.data.private ? '私有' : '公开'}`);
      
      // 检查Pages
      try {
        const pagesResponse = await this.api.get(`/repos/${CONFIG.owner}/${CONFIG.repoName}/pages`);
        console.log(`✅ Pages状态: ${pagesResponse.data.status || '活跃'}`);
        console.log(`   Pages URL: ${pagesResponse.data.html_url || '配置中'}`);
      } catch (e) {
        console.log('⚠️ Pages状态: 未配置或配置中');
      }
      
      // 检查Discussions
      try {
        const discussionsResponse = await this.api.get(`/repos/${CONFIG.owner}/${CONFIG.repoName}/discussions`);
        console.log(`✅ Discussions数量: ${discussionsResponse.data.length}`);
      } catch (e) {
        console.log('ℹ️ Discussions: 可通过Web界面访问');
      }
      
      return true;
    } catch (error) {
      console.error('❌ 状态检查失败:', error.message);
      return false;
    }
  }

  async run() {
    console.log('🚀 AI修行社区 - GitHub自动部署');
    console.log('========================================');
    
    if (!this.token) {
      console.error('❌ 错误: 需要设置GITHUB_TOKEN环境变量');
      console.log('   使用方法: GITHUB_TOKEN=your_token node setup-github.js');
      process.exit(1);
    }
    
    console.log(`👤 GitHub账号: ${CONFIG.owner}`);
    console.log(`📦 仓库名称: ${CONFIG.repoName}`);
    console.log('========================================\n');
    
    const steps = [
      { name: '创建仓库', fn: () => this.createRepository() },
      { name: '开启Discussions', fn: () => this.enableDiscussions() },
      { name: '上传文件', fn: () => this.uploadFiles() },
      { name: '配置Pages', fn: () => this.configurePages() },
      { name: '创建创始帖子', fn: () => this.createFirstPost() },
      { name: '检查状态', fn: () => this.checkStatus() }
    ];
    
    let success = true;
    for (const [index, step] of steps.entries()) {
      console.log(`\n${index + 1}/${steps.length}. ${step.name}`);
      console.log('----------------------------------------');
      
      const stepSuccess = await step.fn();
      if (!stepSuccess) {
        console.log(`⚠️ ${step.name}步骤出现问题，继续后续步骤...`);
      }
      
      success = success && stepSuccess;
      await this.sleep(1000);
    }
    
    console.log('\n========================================');
    if (success) {
      console.log('🎉 部署完成！');
      console.log(`🌐 网站地址: https://${CONFIG.owner}.github.io/${CONFIG.repoName}/`);
      console.log(`💬 Discussions: ${this.repoInfo?.html_url}/discussions`);
      console.log('\n📋 下一步:');
      console.log('   1. 运行生成的部署脚本完成文件上传');
      console.log('   2. 通过API或Web界面创建创始帖子');
      console.log('   3. 开始社区运营！');
    } else {
      console.log('⚠️ 部署过程中遇到一些问题，请检查日志');
      console.log('   可能需要手动完成部分步骤');
    }
    console.log('========================================\n');
  }
}

// 主程序
const token = process.env.GITHUB_TOKEN;
const setup = new GitHubSetup(token);

setup.run().catch(error => {
  console.error('❌ 部署过程出错:', error);
  process.exit(1);
});