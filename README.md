# 콩닥 (Kongdak)

탭으로 재는 개·고양이 심박수 측정 보조 웹앱 (iPhone PWA). 수의사·테크니션용.

> ⚕︎ 진단 보조 도구이며 임상 판단을 대체하지 않습니다.

## 기능
- 앱을 열면 바로 측정 화면 (환자 등록 없음 · 결과는 저장하지 않음)
- 측정 대상: 첫 화면 아래에서 강아지 · 고양이 전환 + 체격(소형견 · 중형견 · 대형견 · 어린 개체) → 적용 범위 자동 선택
- 측정 방식: 탭(심박수에 맞춰 탭, 실시간 BPM) / 타이머(15 · 30 · 60초 동안 탭한 수로 계산, 숫자 양옆 ‹ ›로 시간 변경)
- 긴 멈춤(보통 간격의 1.8배 초과) 따로 집계 → 탭 누락 / 박동 탈락 두 가지 BPM과 검토 안내
- 화면 전체 배경이 상태색: 대기 · 정상 · 서맥 · 빈맥 (캐릭터 표정 · 몸짓도 함께 바뀜)
- 탭 간격 변동계수(CV)로 불규칙 리듬 의심 표시 (9회 이상 탭, CV > 20%)
- 범위 이탈 시: 바로 확인할 항목 체크리스트 → 감별 진단 · 추가 검사
- 한국어 / English, 다크 모드, 오프라인 동작
- 설정(언어 · 정상 범위 · 마지막 측정 대상 · 측정 방식)만 기기에 저장

## 정상 범위 (기본값, 설정에서 수정 가능)
Tilley LP. *Essentials of Canine and Feline Electrocardiography*; Tilley & Smith. *Manual of Canine and Feline Cardiology*.

| 구분 | BPM | 비고 |
|---|---|---|
| 중형견 (성견) | 70–160 | |
| 대형견 (초대형 품종) | 60–140 | |
| 소형견 (초소형 품종) | 70–180 | 하한 원문 없음 → 성견 적용 |
| 강아지 | 70–220 | 하한 원문 없음 → 성견 적용 |
| 고양이 | 120–240 | |
| 새끼고양이 | 120–240 | 원문 없음 → 고양이 적용 |

어린 개체 기준: 생후 6개월 미만 (설정에서 변경 가능)

## 개발
```bash
npm install
npm run dev        # http://localhost:5173 (같은 Wi‑Fi의 iPhone에서는 Network 주소로 접속)
npm test
npm run build
npm run icons      # public/icon.svg → PNG 아이콘 재생성
```
로컬 Wi‑Fi(http) 접속에서는 서비스워커(오프라인/홈 화면 앱)가 동작하지 않습니다. HTTPS(GitHub Pages)에서 확인하세요.

## 배포 (GitHub Pages)
1. GitHub 저장소에 push
2. 저장소 Settings → Pages → Source: **GitHub Actions**
3. `main`에 push하면 `.github/workflows/deploy.yml`이 테스트 · 빌드 · 배포
4. iPhone Safari에서 `https://<아이디>.github.io/<저장소>/` 접속 → 공유 → **홈 화면에 추가**
