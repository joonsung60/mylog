import { addDoc, collection } from "firebase/firestore";
import { db } from "../firebase";
import { BOTS, validateBotConfig } from "./bot-config";
import { generateEugeneReply, generateEugenePost } from "./eugene/eugene-agent";
import { generateJiminReply, generateJiminPost } from "./jimin/jimin-agent";

/**
 * 봇별 행동 처리 함수 (유진)
 */
async function handleEugeneAction(logContent, logId, userId, referenceDate) {
  const eugeneConfig = validateBotConfig(BOTS.EUGENE);
  const { replyChance, postChance } = eugeneConfig.behavior;

  const dice = Math.random();
  console.log(`🎲 유진 행동 주사위: ${dice.toFixed(3)}`);
  console.log(`   [댓글: 0~${replyChance}] [글: ${replyChance}~${replyChance + postChance}] [침묵: ${replyChance + postChance}~1.0]`);

  if (dice < replyChance) {
    // 댓글 달기
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
    // 자기 글 쓰기
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
    // 아무것도 안 함
    console.log("😶 -> 유진이 조용히 지켜봅니다.");
  }
}

/**
 * 봇별 행동 처리 함수 (지민)
 */
async function handleJiminAction(logContent, logId, userId, referenceDate) {
  const jiminConfig = validateBotConfig(BOTS.JIMIN);
  const { replyChance, postChance } = jiminConfig.behavior;

  const dice = Math.random();
  console.log(`🎲 지민 행동 주사위: ${dice.toFixed(3)}`);
  console.log(`   [댓글: 0~${replyChance}] [글: ${replyChance}~${replyChance + postChance}] [침묵: ${replyChance + postChance}~1.0]`);

  if (dice < replyChance) {
    // 댓글 달기
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

  } else if (dice < replyChance + postChance) {
    // 자기 글 쓰기
    console.log("✅ -> 지민이 자기 글을 씁니다.");
    const post = await generateJiminPost();

    if (post) {
      await addDoc(collection(db, "logs"), {
        log: post,
        createdAt: Date.now(),
        referenceDate: referenceDate,
        username: jiminConfig.name,
        userId: jiminConfig.id,
        isBot: true,
        photo: null,
      });
    }

  } else {
    // 아무것도 안 함
    console.log("😶 -> 지민이 조용히 지켜봅니다.");
  }
}

/**
 * 사용자가 글을 쓸 때 - 모든 봇들이 독립적으로 반응 결정
 */
export async function handleUserPost(logContent, logId, userId, referenceDate) {
  try {
    // 유진과 지민이 독립적으로 행동 (병렬 처리)
    await Promise.all([
      handleEugeneAction(logContent, logId, userId, referenceDate),
      handleJiminAction(logContent, logId, userId, referenceDate)
    ]);
  } catch (error) {
    console.error("봇 행동 중 에러:", error);
  }
}

/**
 * 사용자가 댓글을 달 때 - 모든 봇들이 독립적으로 대댓글 결정
 */
export async function handleUserComment(commentText, logId, userId) {
  const eugene = BOTS.EUGENE;
  const jimin = BOTS.JIMIN;

  try {
    // 유진 대댓글
    if (Math.random() < eugene.behavior.reReplyChance) {
      console.log("-> 유진이 대댓글을 답니다.");

      const contextForEugene = `[User's Comment]: "${commentText}"`;
      const reply = await generateEugeneReply(contextForEugene, userId);

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

    // 지민 대댓글
    if (Math.random() < jimin.behavior.reReplyChance) {
      console.log("-> 지민이 대댓글을 답니다.");

      const contextForJimin = `[User's Comment]: "${commentText}"`;
      const reply = await generateJiminReply(contextForJimin, userId);

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