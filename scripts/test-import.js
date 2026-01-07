import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const MWEB_THEMES_DIR = path.join(__dirname, '../../mweb-themes-master/src/themes')
const OUTPUT_DIR = path.join(__dirname, '../src/themes/styles')

console.log('MWEB_THEMES_DIR:', MWEB_THEMES_DIR)
console.log('OUTPUT_DIR:', OUTPUT_DIR)
console.log('MWEB_THEMES_DIR exists:', fs.existsSync(MWEB_THEMES_DIR))
console.log('OUTPUT_DIR exists:', fs.existsSync(OUTPUT_DIR))

// 检查一个示例文件
const testFile = path.join(MWEB_THEMES_DIR, 'mweb-ayu.scss')
console.log('Test file exists:', fs.existsSync(testFile))

if (fs.existsSync(testFile)) {
  console.log('Test file content (first 100 chars):', fs.readFileSync(testFile, 'utf-8').substring(0, 100))
}

