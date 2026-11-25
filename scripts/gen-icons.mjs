// public/icon.svg(콩닥 강아지 · 정상 표정) → PWA / iOS 아이콘 PNG 생성
// icon.svg는 앱의 <Pet crop="head"> 렌더 결과를 그대로 저장한 것.
// 둥근 모서리 바깥은 투명이므로, PNG는 배경색으로 꽉 채워 OS가 직접 마스크하게 한다.
import sharp from 'sharp'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const BG = '#3fa68c' // 정상 상태 배경색
const svg = await readFile(new URL('../public/icon.svg', import.meta.url))
const out = (name) => fileURLToPath(new URL(`../public/${name}`, import.meta.url))
const render = (size) => sharp(svg, { density: 600 }).resize(size, size).flatten({ background: BG }).png()

await render(192).toFile(out('icon-192.png'))
await render(512).toFile(out('icon-512.png'))
await render(180).toFile(out('apple-touch-icon.png'))
console.log('icons generated')
