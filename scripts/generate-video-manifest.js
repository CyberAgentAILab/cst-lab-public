import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 動画ファイルの拡張子リスト
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.avi', '.mov', '.mkv', '.m4v'];

// public/movies ディレクトリのパス
const moviesDir = path.join(__dirname, '../public/movies');
const manifestPath = path.join(__dirname, '../public/videos-manifest.json');

function generateVideoManifest() {
  try {
    // moviesディレクトリが存在するかチェック
    if (!fs.existsSync(moviesDir)) {
      console.log('movies directory does not exist, creating empty manifest');
      fs.writeFileSync(manifestPath, JSON.stringify({ videos: [] }, null, 2));
      return;
    }

    // ディレクトリ内のファイルを読み取り
    const files = fs.readdirSync(moviesDir);
    
    // 動画ファイルのみをフィルタリング
    const videoFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return VIDEO_EXTENSIONS.includes(ext);
    });

    // manifest.json用のデータ構造を作成
    const manifest = {
      generated: new Date().toISOString(),
      videos: videoFiles.map((filename, index) => ({
        id: index + 1,
        filename: filename,
        name: filename.replace(/\.[^/.]+$/, ""), // 拡張子を除去
        displayName: `動画${index + 1}: ${filename.replace(/\.[^/.]+$/, "")}`,
        path: `./movies/${filename}`
      }))
    };

    // manifest.jsonファイルを書き出し
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    
    console.log(`Generated video manifest with ${videoFiles.length} videos:`);
    videoFiles.forEach(file => console.log(`  - ${file}`));
    
  } catch (error) {
    console.error('Error generating video manifest:', error);
    // エラー時は空のmanifestを生成
    fs.writeFileSync(manifestPath, JSON.stringify({ 
      generated: new Date().toISOString(),
      error: error.message,
      videos: [] 
    }, null, 2));
  }
}

generateVideoManifest();