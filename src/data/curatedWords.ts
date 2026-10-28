export interface CuratedCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  words: {
    word: string;
    korean: string;
    level: string;
  }[];
}

export const CURATED_CATEGORIES: CuratedCategory[] = [
  {
    id: 'daily',
    name: '일상 & 감정 회화',
    icon: '☕',
    description: '원어민들이 대화에서 가장 자주 쓰는 감정 및 뉘앙스 표현',
    words: [
      { word: 'serendipity', korean: '뜻밖의 행운, 길조', level: 'B2' },
      { word: 'empathy', korean: '공감, 감정이입', level: 'B1' },
      { word: 'procrastinate', korean: '미루다, 늑장 부리다', level: 'B2' },
      { word: 'overwhelmed', korean: '벅찬, 압도된', level: 'B1' },
      { word: 'spontaneous', korean: '즉흥적인, 자발적인', level: 'B2' },
      { word: 'wholesome', korean: '건전한, 마음이 따뜻해지는', level: 'B2' },
    ],
  },
  {
    id: 'business',
    name: '비즈니스 & 커리어',
    icon: '💼',
    description: '글로벌 업무 미팅과 영문 이메일에서 신뢰감을 주는 핵심 어휘',
    words: [
      { word: 'resilient', korean: '회복력 있는, 강인한', level: 'B2' },
      { word: 'articulate', korean: '조리 있게 설명하다, 유창한', level: 'C1' },
      { word: 'collaborate', korean: '협력하다, 공동 작업하다', level: 'B1' },
      { word: 'prioritize', korean: '우선순위를 매기다', level: 'B1' },
      { word: 'streamline', korean: '간소화하다, 능률화하다', level: 'B2' },
      { word: 'tangible', korean: '실질적인, 유형의', level: 'B2' },
    ],
  },
  {
    id: 'academic',
    name: '토익 / 토플 / 수능 빈출',
    icon: '🎓',
    description: '각종 영어 시험에서 고득점을 가르는 핵심 어휘군',
    words: [
      { word: 'meticulous', korean: '꼼꼼한, 세심한', level: 'C1' },
      { word: 'ambiguous', korean: '모호한, 다의적인', level: 'B2' },
      { word: 'ubiquitous', korean: '어디에나 존재하는', level: 'C1' },
      { word: 'pragmatic', korean: '실용적인, 현실적인', level: 'C1' },
      { word: 'unprecedented', korean: '전례 없는, 파격적인', level: 'C1' },
      { word: 'comprehensive', korean: '종합적인, 포괄적인', level: 'B2' },
    ],
  },
  {
    id: 'nuance',
    name: '고급 뉘앙스 & 미드 표현',
    icon: '🎬',
    description: '단어 하나로 분위기를 확 바꾸는 매력적인 영어 표현',
    words: [
      { word: 'epiphany', korean: '문득 깨달음, 직관', level: 'C1' },
      { word: 'vulnerable', korean: '취약한, 상처받기 쉬운', level: 'B2' },
      { word: 'eloquent', korean: '달변인, 설득력 있는', level: 'C1' },
      { word: 'subtle', korean: '미묘한, 은은한', level: 'B2' },
      { word: 'quintessential', korean: '전형적인, 본질적인', level: 'C2' },
      { word: 'authentic', korean: '진정한, 진짜의', level: 'B2' },
    ],
  },
];
