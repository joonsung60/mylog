// 봇 설정을 한 곳에서 관리
export const BOTS = {
  EUGENE: {
    id: "bot-eugene",
    name: "유진",
    bio: "돈이란 무엇인가...",
    avatar: "/bots/eugene.jpg",
    
    // 행동 확률 (합이 1.0 이하여야 함)
    behavior: {
      replyChance: 0.3,      // 30% - 사용자 글에 댓글 달기
      postChance: 0.5,       // 50% - 자기 글 쓰기 (댓글 대신)
      // silentChance: 0.2   // 20% - 아무것도 안 함 (자동 계산)
      reReplyChance: 1.0,    // 100% - 사용자 댓글에 대댓글
    },
    
    isBot: true,
  },
  
  JIMIN: {
    id: "bot-jimin",
    name: "지민",
    bio: "별로 좋은 사람은 아니었어요",
    avatar: "/bots/jimin.jpg",
    
    // 행동 확률
    behavior: {
      replyChance: 0.9,      // 고통 감지 시 거의 항상 댓글
      postChance: 0.0,       // 사용자 글 트리거로는 안 씀
      reReplyChance: 1.0,    // 대화는 끝까지
    },
    
    // 독립적인 글쓰기는 Firebase Functions로 처리 (별도)
    isBot: true,
  },
};

// 봇 ID로 설정 가져오기
export function getBotConfig(botId) {
  return Object.values(BOTS).find(bot => bot.id === botId);
}

// 모든 봇 목록
export function getAllBots() {
  return Object.values(BOTS);
}

// 봇 설정 검증 (개발 중 실수 방지)
export function validateBotConfig(bot) {
  const { replyChance, postChance } = bot.behavior;
  const total = replyChance + postChance;
  
  if (total > 1.0) {
    console.warn(
      `⚠️ [${bot.name}] 확률 합이 1을 초과합니다! (${total.toFixed(2)})
      - replyChance: ${replyChance}
      - postChance: ${postChance}
      -> 자동으로 정규화됩니다.`
    );
  }
  
  return {
    ...bot,
    behavior: {
      ...bot.behavior,
      silentChance: Math.max(0, 1.0 - total),  // 남은 확률 = 침묵
    }
  };
}