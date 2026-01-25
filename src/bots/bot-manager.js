import { addDoc, collection } from "firebase/firestore";
import { db } from "../firebase";
import { BOTS, validateBotConfig } from "./bot-config";
import { generateEugeneReply, generateEugenePost } from "./eugene/eugene-agent";
import { generateJiminReply } from "./jimin/jimin-agent";
import { shouldJiminIntervene } from "../utils/distress-detector";

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
    const reply = await generateEugeneReply(logContent, userId);

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
    const reply = await generateJiminReply(logContent, userId);

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
      
      // 유진은 작동 안 함 (지민이 담당)
      
    } else {
      // 평소 → 유진만 작동
      await handleEugeneAction(logContent, logId, userId, referenceDate);
    }
    
  } catch (error) {
    console.error("봇 행동 중 에러:", error);
  }
}

/**
 * 사용자가 댓글을 달 때
 */
export async function handleUserComment(commentText, logId, userId, originalAuthorId) {
  const eugene = BOTS.EUGENE;
  const jimin = BOTS.JIMIN;

  try {
    // 1. 원글이 봇 글이면 → 그 봇만 답변
    if (originalAuthorId === "bot-eugene") {
      console.log("-> 유진 글에 댓글 → 유진만 답변");
      
      if (Math.random() < eugene.behavior.reReplyChance) {
        const reply = await generateEugeneReply(`[User's Comment]: "${commentText}"`, userId);
        
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
      return; // 유진만 답변하고 종료
    }
    
    if (originalAuthorId === "bot-jimin") {
      console.log("-> 지민 글에 댓글 → 지민만 답변");
      
      if (Math.random() < jimin.behavior.reReplyChance) {
        const reply = await generateJiminReply(`[User's Comment]: "${commentText}"`, userId);
        
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
      return; // 지민만 답변하고 종료
    }

    // 2. 일반 사용자 글 → 이름 언급 감지
    const mentionsEugene = commentText.includes("유진") || 
                          commentText.includes("@유진") ||
                          commentText.match(/유진[아이]/);
    
    const mentionsJimin = commentText.includes("지민") || 
                         commentText.includes("@지민") ||
                         commentText.match(/지민[아이]/);
    
    // 3-1. 유진만 언급
    if (mentionsEugene && !mentionsJimin) {
      console.log("-> 유진 언급 감지 → 유진만 답변");
      
      if (Math.random() < eugene.behavior.reReplyChance) {
        const reply = await generateEugeneReply(`[User's Comment]: "${commentText}"`, userId);
        
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
      return;
    }
    
    // 3-2. 지민만 언급
    if (mentionsJimin && !mentionsEugene) {
      console.log("-> 지민 언급 감지 → 지민만 답변");
      
      // 고통 감지도 함께
      const needsJimin = await shouldJiminIntervene(commentText, userId);
      
      if (needsJimin || Math.random() < jimin.behavior.reReplyChance) {
        const reply = await generateJiminReply(`[User's Comment]: "${commentText}"`, userId);
        
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
      return;
    }
    
    // 4. 아무도 언급 안 함 or 둘 다 언급 → 낮은 확률로 각자 답변
    console.log("-> 특정 언급 없음 → 낮은 확률 답변");
    
    // 유진 (30% → 15%로 낮춤)
    if (Math.random() < 0.15) {
      const reply = await generateEugeneReply(`[User's Comment]: "${commentText}"`, userId);
      
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
    
    // 지민 (고통 감지 여부에 따라)
    const needsJimin = await shouldJiminIntervene(commentText, userId);
    
    if (needsJimin && Math.random() < 0.3) {
      const reply = await generateJiminReply(`[User's Comment]: "${commentText}"`, userId);
      
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

  } catch (error) {
    console.error("봇 대댓글 중 에러:", error);
  }
}