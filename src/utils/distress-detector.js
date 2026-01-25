/**
 * 사용자의 글에서 고통/괴로움/스트레스 신호를 감지하는 유틸리티
 */

// 고통 관련 키워드
const DISTRESS_KEYWORDS = [
  // 직접적인 고통 표현
  "힘들", "괴롭", "우울", "슬프", "아프", "외롭", "지쳤", "지친",
  "피곤", "답답", "막막", "불안", "걱정", "두렵", "무섭",

  // 부정적 감정
  "싫", "짜증", "화", "분노", "절망", "좌절", "실망",
  "후회", "미안", "죄책", "부끄",

  // 극단적 표현
  "죽고 싶", "사라지고 싶", "도망치고 싶", "그만두고 싶",
  "포기", "끝", "더 이상",

  // 고통 정도 강조
  "너무", "진짜", "정말", "완전", "엄청", "미치게",

  // 부정 표현
  "안 돼", "못 하", "할 수 없", "안되", "못해", "안 해",

  // 이모지/기호
  "ㅠ", "ㅜ", "ㅠㅠ", "ㅜㅜ", "...", "…", "😭", "😢", "😔", "😞", "😟", "😩", "😫"
];

// 고통 감지 함수
export function detectDistress(text) {
  if (!text || typeof text !== 'string') {
    return { isDistressed: false, score: 0, keywords: [] };
  }

  const lowerText = text.toLowerCase();
  const foundKeywords = [];
  let score = 0;

  // 키워드 매칭
  DISTRESS_KEYWORDS.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      foundKeywords.push(keyword);
      score += 1;
    }
  });

  // 느낌표 반복 (!!!, !!!!) - 강한 감정
  const exclamationMatches = text.match(/!{2,}/g);
  if (exclamationMatches) {
    score += exclamationMatches.length * 0.5;
  }

  // 물음표 반복 (???, ????) - 혼란/불안
  const questionMatches = text.match(/\?{2,}/g);
  if (questionMatches) {
    score += questionMatches.length * 0.3;
  }

  // 말줄임표 (... 또는 …) - 무력감
  const ellipsisMatches = text.match(/\.{3,}|…/g);
  if (ellipsisMatches) {
    score += ellipsisMatches.length * 0.4;
  }

  // 고통 정도 판단
  const isDistressed = score >= 1.5;

  return {
    isDistressed,
    score: Math.round(score * 10) / 10,
    keywords: foundKeywords,
    intensity: getIntensity(score)
  };
}

// 고통 강도 분류
function getIntensity(score) {
  if (score >= 5) return "very_high";  // 매우 심각
  if (score >= 3) return "high";       // 심각
  if (score >= 1.5) return "moderate"; // 보통
  return "low";                         // 낮음
}

// 고통 감지 결과를 로그로 출력 (디버깅용)
export function logDistressDetection(text, result) {
  if (result.isDistressed) {
    console.log(`🚨 고통 감지됨! (강도: ${result.intensity}, 점수: ${result.score})`);
    console.log(`   텍스트: "${text}"`);
    console.log(`   키워드: [${result.keywords.join(", ")}]`);
  }
}
