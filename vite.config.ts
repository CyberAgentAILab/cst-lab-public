import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')

  // 環境変数からPublic/Privateを判定
  const isPublicRepo = env.VITE_PUBLIC_REPO === 'true'
  const repoName = env.VITE_REPO_NAME || 'cst-lab'

  // 開発時は常に '/', ビルド時はリポジトリタイプに応じて設定
  const base = command === 'build'
    ? (isPublicRepo ? `/${repoName}/` : '/')
    : '/'

  console.log(`Building with base path: ${base} (${isPublicRepo ? 'public' : 'private'} repo)`)

  return {
    plugins: [react()],
    base,
  }
})
