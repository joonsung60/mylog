import OpenAI from "openai";
import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { db } from "../../firebase";
import { buildSystemPrompt, buildPostingPrompt } from "./jimin-prompts";
import { detectDistress, logDistressDetection } from "../../utils/distress-detector";

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export const generateJiminReply = async (currentLog, userId) => {
  try {
    // 1. 고통 감지
    const distressResult = detectDistress(currentLog);
    logDistressDetection(currentLog, distressResult);

    // 2. 사용자의 과거 기록 가져오기
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
            const speaker = data.isBot ? "[Jimin(나)]" : "[User(친구)]";
            return `${speaker}: ${data.log}`;
        }).join("\n");

    console.log("🤖 지민이가 참고할 과거 기억:\n", pastLogs);

    // 3. 시스템 프롬프트 생성
    const systemPrompt = buildSystemPrompt(pastLogs);

    // 4. 유저 프롬프트에 고통 정보 추가
    let userPrompt = `사용자의 이번 기록: "${currentLog}"`;

    if (distressResult.isDistressed) {
      userPrompt += `\n\n[주의] 사용자가 고통스러워하고 있습니다. (강도: ${distressResult.intensity}, 점수: ${distressResult.score})
감지된 키워드: ${distressResult.keywords.join(", ")}
-> 더욱 주의깊게 경청하고, 부드럽게 존재를 확인해주세요.`;
    } else {
      userPrompt += `\n\n[모드] 평소 모드 - 침착하게 경청하고, 부드러운 현존을 제공하세요.`;
    }

    // 5. OpenAI API 호출
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      model: "gpt-4o-mini",
      temperature: 0.8,  // 침착하되 다양한 경청 표현
    });

    return completion.choices[0].message.content;

  } catch (error) {
    console.error("(Jimin Reply Error):", error);
    return null;
  }
};

export const generateJiminPost = async () => {
  try {
    const systemPrompt = buildPostingPrompt();

    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "지금 너의 마음속 생각을 짧게 기록해줘. 교훈적이지 않게, 있는 그대로." }
      ],
      model: "gpt-4o-mini",
      temperature: 0.9,  // 더 다양한 사색적 표현
    });

    return completion.choices[0].message.content;

  } catch (error) {
    console.error("(Jimin Post Error):", error);
    return null;
  }
};
