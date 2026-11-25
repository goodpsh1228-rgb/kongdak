// 캐릭터 확인용 (앱 빌드에 포함되지 않음): 모든 종 × 표정을 크게 렌더
import { createRoot } from 'react-dom/client'
import { Pet } from '../src/components/Pet'
import type { Mood } from '../src/lib/petArt'

const moods: Mood[] = ['idle', 'happy', 'sleepy', 'stressed', 'worried']
createRoot(document.getElementById('root')!).render(
  <div className="grid">
    {(['dog', 'cat'] as const).flatMap((sp) =>
      moods.map((m) => (
        <figure key={sp + m}>
          <Pet species={sp} mood={m} size={260} />
          {sp} · {m}
        </figure>
      )),
    )}
  </div>,
)
