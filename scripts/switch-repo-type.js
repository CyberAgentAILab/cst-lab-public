#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const envPath = path.join(__dirname, '..', '.env');

async function main() {
  console.log('=== リポジトリタイプ切り替えスクリプト ===\n');

  const currentEnv = fs.existsSync(envPath) 
    ? fs.readFileSync(envPath, 'utf-8')
    : '';
  
  const currentType = currentEnv.includes('VITE_PUBLIC_REPO=true') ? 'public' : 'private';
  console.log(`現在の設定: ${currentType === 'public' ? 'Public' : 'Private'} リポジトリ\n`);

  console.log('リポジトリタイプを選択してください:');
  console.log('1. Private リポジトリ (特殊なGitHub Pagesドメイン)');
  console.log('2. Public リポジトリ (https://[org].github.io/[repo]/)');
  
  const answer = await new Promise(resolve => {
    rl.question('\n選択 (1 or 2): ', resolve);
  });

  const isPublic = answer === '2';
  
  let repoName = 'cst-lab';
  if (isPublic) {
    const nameAnswer = await new Promise(resolve => {
      rl.question('リポジトリ名を入力してください (デフォルト: cst-lab): ', resolve);
    });
    if (nameAnswer.trim()) {
      repoName = nameAnswer.trim();
    }
  }

  const envContent = `# GitHub Pages deployment configuration
VITE_PUBLIC_REPO=${isPublic}
VITE_REPO_NAME=${repoName}
`;

  fs.writeFileSync(envPath, envContent);
  
  console.log(`\n✅ 設定を ${isPublic ? 'Public' : 'Private'} リポジトリに更新しました`);
  if (isPublic) {
    console.log(`   リポジトリ名: ${repoName}`);
    console.log(`   デプロイURL: https://[org].github.io/${repoName}/`);
  } else {
    console.log(`   デプロイURL: https://[random].pages.github.io/`);
  }
  
  console.log('\n次のコマンドでデプロイしてください:');
  console.log('  npm run deploy');
  
  rl.close();
}

main().catch(err => {
  console.error('エラーが発生しました:', err);
  rl.close();
  process.exit(1);
});