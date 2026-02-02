import OpenAI from "openai";
import { collection, getDocs, limit, orderBy, query, where, doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { buildSystemPrompt, buildPostingPrompt } from "./eugene-prompts";

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

// 유진의 고유 ID (bot-config.js 등에 정의된 값과 일치해야 함)
const EUGENE_BOT_ID = "bot-eugene";

/**
 * 대화의 전체 맥락(원글 + 댓글들)을 가져오는 함수
 */
async function getCommentContext(logId) {
  try {
    const logDocRef = doc(db, "logs", logId);
    const logDocSnap = await getDoc(logDocRef);
    const originalLog = logDocSnap.exists() ? logDocSnap.data()?.log || "" : "";

    const commentsRef = collection(db, "logs", logId, "comments");
    const q = query(commentsRef, orderBy("createdAt", "asc"));
    const snapshot = await getDocs(q);

    const comments = snapshot.docs.map(doc => {
      const data = doc.data();
      return `${data.username}: "${data.text}"`;
    }).join("\n");

    return `[원글]\n${originalLog}\n\n[댓글 대화]\n${comments || "(댓글 없음)"}`;
  } catch (error) {
    console.error("맥락 가져오기 실패:", error);
    return "";
  }
}

/**
 * 유진의 답변 생성 로직
 */
export const generateEugeneReply = async (currentLog, userId, logId = null) => {
  
  try {
    // 1. [상황 판단] 원글 작성자가 유진(나)인지 확인
    let isMyPost = false;
    if (logId) {
      const logDocRef = doc(db, "logs", logId);
      const logDocSnap = await getDoc(logDocRef);
      if (logDocSnap.exists()) {
        isMyPost = logDocSnap.data().userId === EUGENE_BOT_ID;
      }
    }

    const profileRef = doc(db, "users", userId, "profiles", "global_summary");
    const profileSnap = await getDoc(profileRef);
    const userProfile = profileSnap.exists() ? profileSnap.data().summary : "";

    // 2. [기억 추출] 사용자의 최근 기록들 가져오기 (화자 구분 포함)
    const logsRef = collection(db, "logs");
    const q = query(
        logsRef, 
        where("userId", "==", userId), 
        orderBy("createdAt", "desc"), 
        limit(10)
    );
    const snapshot = await getDocs(q);
    
    const pastLogs = snapshot.empty
        ? "과거 기록 없음."
        : snapshot.docs.map(doc => {
            const data = doc.data();
            const speaker = data.isBot ? "[Eugene(나)]" : "[User(친구)]";
            return `${speaker}: ${data.log}`;
        }).join("\n");

    // 3. [맥락 구성] 현재 대화 상황 정리
    let contextPrompt = `사용자의 이번 발언: "${currentLog}"`;
    if (logId) {
      const commentContext = await getCommentContext(logId);
      if (commentContext) {
        contextPrompt = `${commentContext}\n\n위 대화 맥락을 참고해. 사용자의 최신 댓글: "${currentLog}"`;
      }
    }

    // 4. [프롬프트 생성] isMyPost 값을 넘겨 유진에게 현재 상황을 주입
    const systemPrompt = buildSystemPrompt(pastLogs, isMyPost, userProfile);

    // 5. [AI 호출]
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: contextPrompt }
      ],
      model: "gpt-4o-mini",
      temperature: 0.7,
    });

    console.log(`🤖 유진 응답 (isMyPost: ${isMyPost}):`, completion.choices[0].message.content);
    return completion.choices[0].message.content;

  } catch (error) {
    console.error("(Eugene Agent Error):", error);
    return null; 
  }
};

/**
 * 유진의 독백 포스팅 생성 로직
 */
export const generateEugenePost = async () => {
  try {
    const systemPrompt = buildPostingPrompt();
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "지금 이 순간의 행동을 짧게 기록해줘." }
      ],
      model: "gpt-4o-mini",
      temperature: 0.8,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error("(Eugene Post Error):", error);
    return null;
  }
};