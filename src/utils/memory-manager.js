import { db } from "../firebase";
import { doc, getDoc, setDoc, collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { buildGlobalProfileAnalysisPrompt } from "./memory-prompts";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

/**
 * 모든 봇이 공유하는 중앙 집중형 사용자 프로필 업데이트 함수
 */
export const syncUserProfile = async (userId) => {
  try {
    const profileRef = doc(db, "users", userId, "profiles", "global_summary");
    const profileSnap = await getDoc(profileRef);
    const currentSummary = profileSnap.exists() ? profileSnap.data().summary : "";

    // 최신 로그 15개 추출
    const logsRef = collection(db, "logs");
    const q = query(logsRef, where("userId", "==", userId), orderBy("createdAt", "desc"), limit(15));
    const snapshot = await getDocs(q);
    const newLogs = snapshot.docs.map(doc => doc.data().log).join("\n");

    const completion = await openai.chat.completions.create({
      messages: [{ role: "system", content: buildGlobalProfileAnalysisPrompt(currentSummary, newLogs) }],
      model: "gpt-4o-mini",
      temperature: 0.3, // 분석의 객관성을 위해 온도를 낮춤
    });

    const newSummary = completion.choices[0].message.content.replace("새로운 요약: ", "");

    await setDoc(profileRef, {
      summary: newSummary,
      lastUpdated: Date.now(),
    }, { merge: true });

    return newSummary;
  } catch (error) {
    console.error("Global Profile Sync Error:", error);
  }
};