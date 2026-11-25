// 범위 이탈 / 리듬 불규칙 시 검토 안내 (진료실 신체검사 상황 기준)
import type { HrStatus, Species } from './ranges'

export type L = { ko: string; en: string }

export interface GuidanceBlock {
  checklist: L[]
  differentials: { group: L; items: L[] }[]
  tests: L[]
  notes: L[]
}

const commonChecklist: L[] = [
  { ko: '점막 색 · CRT', en: 'Mucous membrane colour · CRT' },
  { ko: '맥박 강도 · 맥박 결손 (청진과 대퇴동맥 동시 촉진)', en: 'Pulse quality · pulse deficit (simultaneous auscultation + femoral palpation)' },
  { ko: '체온', en: 'Rectal temperature' },
  { ko: '호흡수 · 호흡 양상', en: 'Respiratory rate · effort' },
  { ko: '심잡음 · 분마음 (gallop)', en: 'Murmur · gallop sound' },
  { ko: '의식 상태', en: 'Mentation' },
]

const brady: GuidanceBlock = {
  checklist: [
    ...commonChecklist,
    { ko: '방광 크기 · 배뇨 여부 (요도폐색)', en: 'Bladder size · ability to urinate (urethral obstruction)' },
    { ko: '최근 투약 (진정제, 심장약)', en: 'Recent medications (sedatives, cardiac drugs)' },
  ],
  differentials: [
    {
      group: { ko: '생리적 · 미주신경', en: 'Physiologic · vagal' },
      items: [
        { ko: '높은 미주신경 긴장 (운동견, 수면, 이완 상태)', en: 'High vagal tone (athletic dog, sleep, relaxed)' },
        { ko: '단두종 기도 · 위장관 질환에 의한 미주신경 항진', en: 'Increased vagal tone from brachycephalic airway or GI disease' },
      ],
    },
    {
      group: { ko: '전해질 · 대사', en: 'Electrolyte · metabolic' },
      items: [
        { ko: '고칼륨혈증 (Hyperkalemia): 요도폐색, 부신피질기능저하증, 급성신손상, 요복강', en: 'Hyperkalemia: urethral obstruction, hypoadrenocorticism, AKI, uroabdomen' },
        { ko: '저체온증 (Hypothermia)', en: 'Hypothermia' },
        { ko: '갑상선기능저하증 (개)', en: 'Hypothyroidism (dog)' },
      ],
    },
    {
      group: { ko: '약물 · 독성', en: 'Drugs · toxins' },
      items: [
        { ko: 'α2 작용제 (덱스메데토미딘 등), 오피오이드', en: 'α2-agonists (e.g. dexmedetomidine), opioids' },
        { ko: 'β차단제, 칼슘채널차단제, 디곡신', en: 'β-blockers, calcium-channel blockers, digoxin' },
      ],
    },
    {
      group: { ko: '전도계 질환', en: 'Conduction disease' },
      items: [
        { ko: '2도 · 3도 방실차단 (AV block): 3도는 규칙적인 느린 이탈 리듬', en: '2nd / 3rd-degree AV block (3rd-degree: regular slow escape rhythm)' },
        { ko: '3도 방실차단 (고양이): 노령묘 · 심근병증 동반, 이탈 리듬이 100–140이면 범위 안으로 보일 수 있음', en: '3rd-degree AV block (cat): older cats · cardiomyopathy; escape rate 100–140 may look in range' },
        { ko: '동기능부전증후군 (SSS): 웨스티, 미니어처 슈나우저, 코커 스패니얼 호발', en: 'Sick sinus syndrome: Westie, Miniature Schnauzer, Cocker Spaniel' },
        { ko: '심방정지 (Atrial standstill)', en: 'Atrial standstill' },
      ],
    },
    {
      group: { ko: '신경계', en: 'Neurologic' },
      items: [{ ko: '두개내압 상승 (쿠싱 반사 · 두개내압 반사: 서맥과 고혈압, 쿠싱병과 무관)', en: 'Raised intracranial pressure (Cushing reflex: bradycardia + hypertension)' }],
    },
  ],
  tests: [
    { ko: 'ECG (lead II 리듬 스트립)', en: 'ECG (lead II rhythm strip)' },
    { ko: '전해질 (K⁺, Na⁺:K⁺ 비), 혈액가스', en: 'Electrolytes (K⁺, Na⁺:K⁺ ratio), blood gas' },
    { ko: '혈압', en: 'Blood pressure' },
    { ko: 'BUN/Cre, 요검사', en: 'BUN/Cre, urinalysis' },
    { ko: '아트로핀 반응 검사 (미주신경성 여부 구분)', en: 'Atropine response test (vagal vs intrinsic)' },
    { ko: 'ACTH 자극 검사 (부신피질기능저하증 의심 시)', en: 'ACTH stimulation test (if hypoadrenocorticism suspected)' },
    { ko: 'T4 · TSH (개, 갑상선기능저하증 의심 시)', en: 'T4 · TSH (dog, if hypothyroidism suspected)' },
  ],
  notes: [],
}

const tachy: GuidanceBlock = {
  checklist: [
    ...commonChecklist,
    { ko: '통증 점수', en: 'Pain score' },
    { ko: '5–10분 안정 후 재측정 (진료실 스트레스 배제)', en: 'Re-measure after 5–10 min acclimation (exclude exam-room stress)' },
  ],
  differentials: [
    {
      group: { ko: '생리적', en: 'Physiologic' },
      items: [
        { ko: '진료실 스트레스 · 공포 · 흥분', en: 'Exam-room stress · fear · excitement' },
        { ko: '통증', en: 'Pain' },
      ],
    },
    {
      group: { ko: '순환 · 산소 운반', en: 'Perfusion · oxygen delivery' },
      items: [
        { ko: '저혈량 · 쇼크 · 출혈', en: 'Hypovolemia · shock · hemorrhage' },
        { ko: '빈혈', en: 'Anemia' },
        { ko: '저산소혈증', en: 'Hypoxemia' },
        { ko: '발열 · 고체온 · 패혈증/SIRS', en: 'Fever · hyperthermia · sepsis/SIRS' },
      ],
    },
    {
      group: { ko: '심장', en: 'Cardiac' },
      items: [
        { ko: '울혈성 심부전 (CHF)', en: 'Congestive heart failure' },
        { ko: '확장성 심근병증 (DCM, 개) · 비대성 심근병증 (HCM, 고양이)', en: 'DCM (dog) · HCM (cat)' },
        { ko: '빈맥성 부정맥: 상심실성 빈맥(SVT), 심방세동(AF), 심실빈맥(VT)', en: 'Tachyarrhythmia: SVT, atrial fibrillation, ventricular tachycardia' },
      ],
    },
    {
      group: { ko: '내분비 · 약물 · 독성', en: 'Endocrine · drugs · toxins' },
      items: [
        { ko: '갑상선기능항진증 (고양이)', en: 'Hyperthyroidism (cat)' },
        { ko: '케타민, 아트로핀, 교감신경 작용제', en: 'Ketamine, atropine, sympathomimetics' },
        { ko: '기관지확장제 (테르부탈린 · 테오필린): 천식 고양이에서 흔함', en: 'Bronchodilators (terbutaline · theophylline): common in asthmatic cats' },
        { ko: '테오브로민 (초콜릿), 카페인', en: 'Theobromine (chocolate), caffeine' },
        { ko: '갈색세포종 (드묾)', en: 'Pheochromocytoma (rare)' },
      ],
    },
  ],
  tests: [
    { ko: 'ECG (동성빈맥인지 빈맥성 부정맥인지 구분)', en: 'ECG (sinus tachycardia vs tachyarrhythmia)' },
    { ko: '혈압', en: 'Blood pressure' },
    { ko: 'PCV/TS, 젖산', en: 'PCV/TS, lactate' },
    { ko: '전해질 · 혈당', en: 'Electrolytes · glucose' },
    { ko: 'SpO₂ · 혈액가스', en: 'SpO₂ · blood gas' },
    { ko: 'AFAST / TFAST (출혈 · 삼출 확인)', en: 'AFAST / TFAST (haemorrhage, effusion)' },
    { ko: '흉부 방사선 · 심장초음파', en: 'Thoracic radiographs · echocardiography' },
    { ko: 'NT-proBNP', en: 'NT-proBNP' },
    { ko: 'T4 (고양이, 특히 7세 이상)', en: 'T4 (cat, esp. > 7 y)' },
  ],
  notes: [],
}

const irregular: GuidanceBlock = {
  checklist: [
    { ko: '맥박 결손 확인 (청진과 대퇴동맥 동시 촉진)', en: 'Check for pulse deficits (simultaneous auscultation + femoral palpation)' },
    { ko: '호흡과의 연관성 (흡기 시 빨라지고 호기 시 느려지는가?)', en: 'Relation to breathing (faster on inspiration, slower on expiration?)' },
    { ko: '규칙적으로 불규칙한가, 불규칙하게 불규칙한가', en: 'Regularly irregular vs irregularly irregular' },
  ],
  differentials: [
    {
      group: { ko: '생리적', en: 'Physiologic' },
      items: [{ ko: '호흡성 동성부정맥 (RSA): 개에서는 정상 소견', en: 'Respiratory sinus arrhythmia: normal in dogs' }],
    },
    {
      group: { ko: '병적', en: 'Pathologic' },
      items: [
        { ko: '심실조기수축 (VPC): 비장 종괴, GDV, 외상성 심근염, 심근병증, 저산소 · 저칼륨 · 통증 · 패혈증', en: 'VPCs: splenic mass, GDV, traumatic myocarditis, cardiomyopathy, hypoxia · hypokalemia · pain · sepsis' },
        { ko: '품종 호발: 복서 (ARVC), 도베르만 (DCM)', en: 'Breed predisposition: Boxer (ARVC), Dobermann (DCM)' },
        { ko: '심방조기수축 (APC)', en: 'APCs' },
        { ko: '심방세동 (AF): 불규칙하게 불규칙, 맥박 결손 흔함', en: 'Atrial fibrillation: irregularly irregular, frequent pulse deficits' },
        { ko: '2도 방실차단', en: '2nd-degree AV block' },
      ],
    },
  ],
  tests: [
    { ko: 'ECG (lead II 리듬 스트립, 최소 1–2분)', en: 'ECG (lead II rhythm strip, ≥ 1–2 min)' },
    { ko: '홀터 모니터링 (간헐적인 경우)', en: 'Holter monitoring (if intermittent)' },
    { ko: '전해질', en: 'Electrolytes' },
    { ko: '심장초음파 · 심장 트로포닌 I', en: 'Echocardiography · cardiac troponin I' },
    { ko: '복부 초음파 (VPC + 비장 종괴 의심 시)', en: 'Abdominal ultrasound (VPCs with suspected splenic mass)' },
  ],
  notes: [
    { ko: '탭 오차일 수 있어요. 청진 · ECG로 확인하세요.', en: 'Tapping error can mimic irregularity. Confirm with auscultation and ECG.' },
  ],
}

const pause: GuidanceBlock = {
  checklist: [
    { ko: '측정 중 탭을 놓친 건 아닌지 (다시 재서 멈춤이 재현되는지)', en: 'Was a tap missed? Re-measure to see if the pause recurs' },
    { ko: '청진과 대퇴동맥 동시 촉진: 심음은 들리는데 맥박만 빠지는가 (맥박 결손)', en: 'Simultaneous auscultation + femoral palpation: heart sound present but pulse absent? (pulse deficit)' },
    { ko: '멈춤이 규칙적으로 반복되는가 (예: 2–3박마다 한 번)', en: 'Do pauses recur regularly (e.g. every 2–3 beats)?' },
    { ko: '실신 · 허약 · 운동불내성 병력', en: 'History of syncope, weakness, exercise intolerance' },
    { ko: '최근 진정제 투여 (α2 작용제 등)', en: 'Recent sedation (e.g. α2-agonists)' },
  ],
  differentials: [
    {
      group: { ko: '전도 장애 (심음도 함께 멈춤)', en: 'Conduction disturbance (heart sound also absent)' },
      items: [
        { ko: '2도 방실차단 (Mobitz I · II)', en: '2nd-degree AV block (Mobitz I · II)' },
        { ko: '고도 2도 방실차단 (2:1 · 3:1 전도, 멈춤이 길고 잦음)', en: 'High-grade 2nd-degree AV block (2:1 · 3:1 conduction, long frequent pauses)' },
        { ko: '동정지 · 동방차단', en: 'Sinus arrest · sinoatrial block' },
        { ko: '동기능부전증후군 (SSS): 웨스티, 미니어처 슈나우저, 코커 스패니얼 호발', en: 'Sick sinus syndrome: Westie, Miniature Schnauzer, Cocker Spaniel' },
      ],
    },
    {
      group: { ko: '맥박 결손 (심음은 있음)', en: 'Pulse deficit (heart sound present)' },
      items: [
        { ko: '조기수축 (VPC · APC) 뒤 보상성 휴지', en: 'Premature beats (VPC · APC) with compensatory pause' },
        { ko: '심방세동 (불규칙하게 불규칙)', en: 'Atrial fibrillation (irregularly irregular)' },
      ],
    },
    {
      group: { ko: '생리적 · 약물', en: 'Physiologic · drugs' },
      items: [
        { ko: '높은 미주신경 긴장 (Mobitz I은 건강한 개에서도 보일 수 있음)', en: 'High vagal tone (Mobitz I can occur in healthy dogs)' },
        { ko: 'α2 작용제, 오피오이드, 디곡신, β차단제', en: 'α2-agonists, opioids, digoxin, β-blockers' },
      ],
    },
  ],
  tests: [
    { ko: 'ECG (lead II 리듬 스트립): P파 뒤 QRS 탈락 여부, 조기수축 확인', en: 'ECG (lead II strip): dropped QRS after P waves, premature complexes' },
    { ko: '아트로핀 반응 검사 (미주신경성 여부)', en: 'Atropine response test (vagal vs intrinsic)' },
    { ko: '홀터 모니터링 (간헐적인 경우)', en: 'Holter monitoring (if intermittent)' },
    { ko: '전해질 (K⁺)', en: 'Electrolytes (K⁺)' },
    { ko: '심장초음파', en: 'Echocardiography' },
  ],
  notes: [
    { ko: '탭 누락과 구분되지 않아요. 다시 재거나 ECG로 확인하세요.', en: 'A single missed tap looks the same (≈2× interval). The app cannot tell them apart — re-measure or confirm with ECG.' },
  ],
}

export function pauseGuidance(): GuidanceBlock {
  return pause
}

export function guidanceFor(status: HrStatus, species: Species): GuidanceBlock | undefined {
  if (status === 'brady') {
    const notes = [...brady.notes]
    if (species === 'cat') {
      notes.unshift({
        ko: '고양이 진료실 서맥은 드물어요. 쇼크(흔히 120 미만) · 고칼륨혈증 · 저체온부터 의심하세요.',
        en: 'Cats are usually tachycardic in the clinic. In-clinic bradycardia suggests severe illness (hyperkalemia, hypothermia, shock) until proven otherwise.',
      })
    }
    return { ...brady, notes }
  }
  if (status === 'tachy') {
    const notes = [...tachy.notes]
    if (species === 'cat') {
      notes.unshift({
        ko: '고양이는 진찰실 긴장으로 높게 나올 수 있어요. 안정 후 재측정하고, 계속 240을 넘으면 원인을 찾으세요.',
        en: 'Stress-related rates of 220–240+ are common in cats in the clinic. Re-measure after calming and interpret with exam findings.',
      })
    }
    return { ...tachy, notes }
  }
  return undefined
}

export function irregularGuidance(species: Species): GuidanceBlock {
  const notes = [...irregular.notes]
  if (species === 'cat') {
    notes.unshift({
      ko: '고양이는 RSA가 드물어요. 병적 부정맥 가능성이 높아요.',
      en: 'RSA is uncommon in cats in the clinic — irregularity is more likely pathologic.',
    })
  } else {
    notes.unshift({
      ko: '개는 호흡성 동성부정맥(RSA)이 정상일 수 있어요.',
      en: 'In dogs, respiratory sinus arrhythmia (rate varying with breathing) can be normal.',
    })
  }
  return { ...irregular, notes }
}
