import { addDoc, collection } from "firebase/firestore";
import { db } from "../firebase";
import { BOTS, validateBotConfig } from "./bot-config";
import { generateEugeneReply, generateEugenePost } from "./eugene/eugene-agent";
import { generateJiminReply } from "./jimin/jimin-agent";
import { shouldJiminIntervene } from "../utils/distress-detector";
import { syncUserProfile } from "../utils/memory-manager.js";

/**
 * 유진 행동 처리
 */
async function handleEugeneAction(logContent, logId, userId, referenceDate) {
  const eugeneConfig = validateBotConfig(BOTS.EUGENE);
  const { replyChance, postChance } = eugeneConfig.behavior;

  const dice = Math.random();
  console.log(`🎲 유진 행동 주사위: ${dice.toFixed(3)}`);
  console.log(`   [댓글: 0~${replyChance}] [글: ${replyChance}~${replyChance + postChance}] [침묵: ${replyChance + postChance}~1.0]`);

  if (dice < replyChance) {
    console.log("✅ -> 유진이 댓글을 답니다.");
    const reply = await generateEugeneReply(logContent, userId, logId);

    if (reply) {
      await addDoc(collection(db, "logs", logId, "comments"), {
        text: reply,
        username: eugeneConfig.name,
        userId: eugeneConfig.id,
        createdAt: Date.now(),
        isBot: true
      });
    }

  } else if (dice < replyChance + postChance) {
    console.log("✅ -> 유진이 자기 글을 씁니다 (무관심).");
    const post = await generateEugenePost();

    if (post) {
      await addDoc(collection(db, "logs"), {
        log: post,
        createdAt: Date.now(),
        referenceDate: referenceDate,
        username: eugeneConfig.name,
        userId: eugeneConfig.id,
        isBot: true,
        photo: null,
      });
    }

  } else {
    console.log("😶 -> 유진이 조용히 지켜봅니다.");
  }
}

/**
 * 지민 행동 처리 (고통 감지 시에만 호출됨)
 */
async function handleJiminAction(logContent, logId, userId) {
  const jiminConfig = validateBotConfig(BOTS.JIMIN);
  const { replyChance } = jiminConfig.behavior;

  const dice = Math.random();
  console.log(`🆘 지민 개입 - 주사위: ${dice.toFixed(3)} (댓글 확률: ${replyChance})`);

  if (dice < replyChance) {
    console.log("✅ -> 지민이 댓글을 답니다.");
    const reply = await generateJiminReply(logContent, userId, logId);

    if (reply) {
      await addDoc(collection(db, "logs", logId, "comments"), {
        text: reply,
        username: jiminConfig.name,
        userId: jiminConfig.id,
        createdAt: Date.now(),
        isBot: true
      });
    }
  } else {
    console.log("😶 -> 지민이 조용히 지켜봅니다.");
  }
}

/**
 * 사용자가 글을 쓸 때
 */
export async function handleUserPost(logContent, logId, userId, referenceDate) {
  try {
    // 1. 고통 감지 체크
    const needsJimin = await shouldJiminIntervene(logContent, userId);
    
    if (needsJimin) {
      // 고통 감지 → 지민 우선 개입
      console.log("🆘 고통 감지 → 지민 호출");
      await handleJiminAction(logContent, logId, userId);
    } else {
      // 평소 → 유진만 작동
      await handleEugeneAction(logContent, logId, userId, referenceDate);
    }
    // 2. [시스템 관리] 사용자 프로필 업데이트 (기억 동기화)
    // 봇의 응답이 나가는 것과는 별개로, '백그라운드'에서 조용히 실행합니다.
    // await를 붙이지 않으면 이 작업이 끝날 때까지 기다리지 않고 함수가 종료되어 더 빠릅니다.
    
    // 조건: 매번 하면 비용이 많이 드니, 확률적으로 혹은 특정 조건에서만 실행
    // 예: 10%의 확률로 '지금까지의 기록'을 분석해 프로필 업데이트
    if (Math.random() < 0.1) {
      console.log("🧠 [System] 사용자 기억 분석 및 동기화 시작...");
      syncUserProfile(userId); 
    }
  } catch (error) {
    console.error("봇 행동 중 에러:", error);
  }
}

/**
 * 사용자가 댓글을 달 때
 * @param {string} commentText - 댓글 내용
 * @param {string} logId - 원글 ID
 * @param {string} userId - 댓글 작성자 ID
 * @param {string} originalAuthorId - 원글 작성자 ID
 * @param {string|null} parentCommentAuthorId - 원댓글 작성자 ID (대댓글인 경우)
 */
export async function handleUserComment(commentText, logId, userId, originalAuthorId, parentCommentAuthorId = null) {
  const eugene = BOTS.EUGENE;
  const jimin = BOTS.JIMIN;

  try {
    // === 우선순위 1: 명시적 언급 체크 ===
    const mentionsEugene = /유진[아이]?|@유진/.test(commentText);
    const mentionsJimin = /지민[아이]?|@지민/.test(commentText);
    
    if (mentionsEugene && !mentionsJimin) {
      console.log("🎯 우선순위 1: 유진 언급 → 유진만 100%");
      const reply = await generateEugeneReply(commentText, userId, logId);
      
      if (reply) {
        await addDoc(collection(db, "logs", logId, "comments"), {
          text: reply,
          username: eugene.name,
          userId: eugene.id,
          createdAt: Date.now(),
          isBot: true
        });
      }
      return; // 종료
    }
    
    if (mentionsJimin && !mentionsEugene) {
      console.log("🎯 우선순위 1: 지민 언급 → 지민만 100%");
      const reply = await generateJiminReply(commentText, userId, logId);
      
      if (reply) {
        await addDoc(collection(db, "logs", logId, "comments"), {
          text: reply,
          username: jimin.name,
          userId: jimin.id,
          createdAt: Date.now(),
          isBot: true
        });
      }
      return; // 종료
    }
    
    if (mentionsEugene && mentionsJimin) {
      console.log("🎯 우선순위 1: 둘 다 언급 → 둘 다 100%");
      
      const [eugeneReply, jiminReply] = await Promise.all([
        generateEugeneReply(commentText, userId, logId),
        generateJiminReply(commentText, userId, logId)
      ]);
      
      if (eugeneReply) {
        await addDoc(collection(db, "logs", logId, "comments"), {
          text: eugeneReply,
          username: eugene.name,
          userId: eugene.id,
          createdAt: Date.now(),
          isBot: true
        });
      }
      
      if (jiminReply) {
        await addDoc(collection(db, "logs", logId, "comments"), {
          text: jiminReply,
          username: jimin.name,
          userId: jimin.id,
          createdAt: Date.now(),
          isBot: true
        });
      }
      return; // 종료
    }

    // === 우선순위 2: 원댓글 작성자 or 원글 작성자 체크 ===
    const targetAuthor = parentCommentAuthorId || originalAuthorId;
    
    if (targetAuthor === "bot-eugene") {
      console.log("🎯 우선순위 2: 유진의 댓글/글에 답글 → 유진 100%");
      const reply = await generateEugeneReply(commentText, userId, logId);
      
      if (reply) {
        await addDoc(collection(db, "logs", logId, "comments"), {
          text: reply,
          username: eugene.name,
          userId: eugene.id,
          createdAt: Date.now(),
          isBot: true
        });
      }
      
      // 고통 감지 시 지민도 끼어들기 (옵션 2)
      const needsJimin = await shouldJiminIntervene(commentText, userId);
      if (needsJimin && Math.random() < 0.8) {
        console.log("🆘 고통 감지 → 지민도 끼어들기 (80%)");
        const jiminReply = await generateJiminReply(commentText, userId, logId);
        
        if (jiminReply) {
          await addDoc(collection(db, "logs", logId, "comments"), {
            text: jiminReply,
            username: jimin.name,
            userId: jimin.id,
            createdAt: Date.now(),
            isBot: true
          });
        }
      }
      return; // 종료
    }
    
    if (targetAuthor === "bot-jimin") {
      console.log("🎯 우선순위 2: 지민의 댓글/글에 답글 → 지민 100%");
      const reply = await generateJiminReply(commentText, userId, logId);
      
      if (reply) {
        await addDoc(collection(db, "logs", logId, "comments"), {
          text: reply,
          username: jimin.name,
          userId: jimin.id,
          createdAt: Date.now(),
          isBot: true
        });
      }
      return; // 종료
    }

    // === 우선순위 3: 고통 감지 ===
    const needsJimin = await shouldJiminIntervene(commentText, userId);
    
    if (needsJimin) {
      console.log("🆘 우선순위 3: 고통 감지 → 지민 80%");
      if (Math.random() < 0.8) {
        const reply = await generateJiminReply(commentText, userId, logId);
        
        if (reply) {
          await addDoc(collection(db, "logs", logId, "comments"), {
            text: reply,
            username: jimin.name,
            userId: jimin.id,
            createdAt: Date.now(),
            isBot: true
          });
        }
      }
      return; // 종료
    }

    // === 우선순위 4: 일반 대화 ===
    console.log("💬 우선순위 4: 일반 대화 → 유진 30%");
    if (Math.random() < 0.3) {
      const reply = await generateEugeneReply(commentText, userId, logId);
      
      if (reply) {
        await addDoc(collection(db, "logs", logId, "comments"), {
          text: reply,
          username: eugene.name,
          userId: eugene.id,
          createdAt: Date.now(),
          isBot: true
        });
      }
    }

  } catch (error) {
    console.error("봇 대댓글 중 에러:", error);
  }
}