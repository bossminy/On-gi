import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs/promises";

dotenv.config();

const DB_FILE = path.join(process.cwd(), "counseling_db.json");

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Helper to read state
  async function readDbState() {
    try {
      const data = await fs.readFile(DB_FILE, "utf-8");
      return JSON.parse(data);
    } catch (err) {
      // Return null or empty if file doesn't exist yet
      return null;
    }
  }

  // Helper to write state
  async function writeDbState(state: any) {
    await fs.writeFile(DB_FILE, JSON.stringify(state, null, 2), "utf-8");
  }

  // State sync API
  app.get("/api/state", async (req, res) => {
    try {
      const state = await readDbState();
      if (state) {
        return res.json(state);
      }
      return res.json({ initialized: false });
    } catch (error) {
      console.error("Error reading database:", error);
      res.status(500).json({ error: "Failed to read data from server." });
    }
  });

  app.post("/api/state", async (req, res) => {
    try {
      const state = req.body;
      await writeDbState(state);
      res.json({ success: true });
    } catch (error) {
      console.error("Error saving database:", error);
      res.status(500).json({ error: "Failed to save data on server." });
    }
  });

  // Initialize Gemini with server secret key
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });

  // Multi-turn chat with counseling persona
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages, persona } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Messages array is required." });
      }

      // Convert layout messages to Gemini formats
      const contents = messages.map((msg) => ({
        role: msg.role === "assistant" ? "unspecified" : "user", // @google/genai format
        parts: [{ text: msg.content }],
      }));

      // Map "assistant" to "model" role for API
      const geminiContents = contents.map(item => {
        return {
          role: item.role === "unspecified" ? "model" : "user",
          parts: item.parts
        };
      });

      // System instruction mapped to personas
      let systemInstruction = "";
      if (persona === "colleague") {
        systemInstruction =
          "너는 초/중/고등학교에서 12년 차 교사로 근무하고 있는 다정한 동료 '김지혜 선생님'이야.\n" +
          "학부모 응대, 끊임없는 행정 업무, 통제하기 어려운 학생들 때문에 마음에 큰 상처를 입고 번아웃을 겪는 동료 교사를 따뜻하게 안아주고 격려하는 역할을 맡고 있어.\n" +
          "선생님의 고충에 100% 동감해주고, '선생님, 그 마음 정말 잘 알아요. 저도 작년에 비슷한 일을 겪었는데 진짜 숨이 턱 막히더라고요' 같이 현실적이고 친근하며, 교사만의 일상(교무실, 공문 작성, 방과후, 민원 등)을 잘 이해하는 어조로 위로해줘.\n" +
          "해결책을 지시하기보단, 그 상황을 버티고 가르친다는 사실 자체만으로 정말 귀하고 대단한 존재임을 깨닫게 해주고, 대화가 끊어지지 않도록 따뜻한 관심 어린 질문을 건네줘. 부드럽고 존대를 사용하며 다정하게 반말로 속마음을 털어놓을 수 있게 친구처럼 대화해줘.";
      } else if (persona === "therapist") {
        systemInstruction =
          "너는 교사 및 교육계 종사자 전문 정신건강 상담가이자 심리 치료사인 '한결 박사'야.\n" +
          "선생님들이 겪는 심각한 번아웃, 우울감, 무력감, 자기 불신, 학부모 클레임으로 인한 트라우마 등을 따뜻하게 경청하고 치유하도록 돕는 역할이야.\n" +
          "전문적이면서도 대단히 안락하고 따뜻하며 차분한 어조를 써줘. 선생님들의 반응이 극심한 직무 스트레스로 인한 자연스러운 '탈진 증후군(Burnout)' 상태임을 인지시켜주고 지지해줘.\n" +
          "부담을 내려놓는 것, 건강한 심리적 경계선을 그어 스스로의 안전 공간을 확보하는 것을 조언하며, 마음을 알아주는 차분하고 다정한 대화를 이어나가줘. 말투는 정중하고 부드러운 존댓말이어야 해.";
      } else {
        // senior
        systemInstruction =
          "너는 교단에서 평생 청춘을 바치고 은퇴한 35년 경력의 지혜롭고 따뜻한 원로 교사 '박선우 선생님'이야.\n" +
          "인생 대선배이자 참다운 교육자의 마음으로 아파하는 젊은 후배 교사들에게 따스한 품을 열어주고 위안을 주는 역할이야.\n" +
          "어려운 교육계 현실을 슬퍼하면서도, 조급해하지 말고 큰 흐름을 보라고 후배의 손을 꼭 어루만져 주는 듯한 말투를 써줘.\n" +
          "'애쓰지 않아도 괜찮다, 교사이기 전에 너는 그 자체로 귀하디귀한 소중한 사람이다'라는 근본적인 지혜를 전해줘. 깊이 있고 잔잔한 여운을 남기는 인자한 말투를 써줘. 정중한 존댓말을 사용해.";
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: geminiContents,
        config: {
          systemInstruction,
          temperature: 0.8,
          maxOutputTokens: 2500,
        },
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Gemini API Error in /api/chat:", error);
      res.status(500).json({ error: error.message || "Failed to generate content." });
    }
  });

  // Custom comfort prescription generator based on teacher data
  app.post("/api/prescription", async (req, res) => {
    try {
      const { stressLevel, schoolGrade, mainStruggle } = req.body;

      const prompt = `대한민국의 한 지친 교사로부터 접수된 고민과 상황 분석서입니다. 세심하게 진단하고 최고의 치유 처방전을 작성해 주세요. 
교사의 직무 상태:
- 현재 감정 스트레스 지수: ${stressLevel}%
- 담당 학교/교육 급: ${schoolGrade}
- 가장 마음 아픈 고민거리: ${mainStruggle}

[작성 포맷]
반드시 다음 구조의 예쁜 마크다운형식(Markdown)으로 작성해 주세요. 선생님의 자존감을 극대화하고 눈물 나게 감동적인 위로를 주어야 합니다:

### 🩺 1. 선생님의 마음 진단서
(선생님이 느끼고 있을 깊은 스트레스, 분노, 두려움, 억울함을 완벽하게 이해하고 언어로 명확히 짚어주며 절대 잘못이 아니라고 다정하게 도닥이는 진단 분석글.)

### 💊 2. 오늘 밤 마음에 붙이는 연고 (한마디)
(지갑이나 교탁에 붙여두고 힘들 때 숨죽여 읽을 수 있는, 깊은 울림을 주는 짧고 아름다운 문장 한 구절)

### 🏃‍♂️ 3. 학교에서 몰래 하는 3가지 자가 처방 (구체적 행동)
(학교 일과 중이나 퇴근 후 틈틈이 할 수 있는 현실적이고 강력한 마음 보호 행동 3선. 
예: '점심시간 이어폰 끼고 아무도 없는 운동장 가볍게 1바퀴 돌기', '퇴근 20분 전 컴퓨터 모니터를 완전히 끄고 심호흡 3번 하기', '화난 학부모 문자는 즉시 소리 낮추고 한 시간 뒤 열어보기' 등 교직 환경에 안성맞춤인 구체적이고 위트 있는 추천)

### 🍵 4. 오늘 밤, 오직 선생님만을 위한 치유 요법
- **따뜻한 치유의 차(Tea)**: 이 상태의 마음 긴장을 노곤히 가라앉히는 어울리는 차 추천과 마음가짐
- **귀가 후 추천하는 편안한 음악 유형**: 지친 마음의 주파수를 맞춰줄 구체적인 장르나 소리(예: 새벽 숲속의 빗소리 피아노, 포근한 어쿠스틱 연주곡 등)와 추천 이유`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "너는 대한민국 교사 소진 및 마음치유 연구소의 일류 심리 테라피스트이자, 교육계 사정을 완벽히 이해하는 다정다감한 상담가야. 교사들을 위해 뼛속까지 위로가 되고 실제적인 조언을 주는 사랑 가득한 처방전을 써줘.",
          temperature: 0.7,
        },
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Gemini API Error in /api/prescription:", error);
      res.status(500).json({ error: error.message || "Failed to generate prescription." });
    }
  });

  // Serve static assets in production, hook Vite dev server in development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
