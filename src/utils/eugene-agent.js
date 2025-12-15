import OpenAI from "openai";
import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { buildSystemPrompt, buildPostingPrompt } from "./eugene-prompts";

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true 
});

export const generateEugeneReply = async (currentLog, userId) => {
  try {
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
        : snapshot.docs.map(doc => `- ${doc.data().log}`).join("\n");

    console.log("🤖 유진이가 참고할 과거 기억:\n", pastLogs);

    const systemPrompt = buildSystemPrompt(pastLogs);

    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `사용자의 이번 기록: "${currentLog}"` }
      ],
      model: "gpt-4o-mini",
      temperature: 0.7,
    });

    return completion.choices[0].message.content;

  } catch (error) {
    console.error("(Error):", error);

    return null; 
  }
};

export const generateEugenePost = async () => {
  try {
    const systemPrompt = buildPostingPrompt();

    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "지금 방금 한 구체적인 행동을 기록해줘." }
      ],
      model: "gpt-4o-mini",
      temperature: 0.8,
    });

    return completion.choices[0].message.content;

  } catch (error) {
    console.error("(Error):", error);
    return null;
  }
};