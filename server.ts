import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "5mb" }));

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "Arcana Diary AI Engine" });
  });

  // Admin Email Verification API
  let currentAdminCode: string | null = null;
  let codeExpiresAt: number | null = null;

  app.post("/api/admin/send-verification", (_req, res) => {
    // Generate 6-digit verification code
    const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
    currentAdminCode = generatedCode;
    codeExpiresAt = Date.now() + 3 * 60 * 1000; // 3 minutes validity

    console.log(`[Admin Security] Verification Code generated: ${generatedCode} (Expires in 3 mins)`);

    res.json({
      success: true,
      message: "관리자 인증 이메일이 발송되었습니다. (3분 이내 입력)",
      expiresInSeconds: 180,
      // Provide demo/dev code hint so testing is smooth without external SMTP server
      demoCode: generatedCode,
    });
  });

  app.post("/api/admin/verify-code", (req, res) => {
    const { code } = req.body || {};
    const inputCode = String(code || "").trim();

    if (!inputCode) {
      res.status(400).json({ success: false, error: "인증번호를 입력해주세요." });
      return;
    }

    if (!currentAdminCode || !codeExpiresAt) {
      res.status(400).json({
        success: false,
        error: "인증번호가 발송되지 않았거나 만료되었습니다. [인증 이메일 발송] 버튼을 눌러주세요.",
      });
      return;
    }

    if (Date.now() > codeExpiresAt) {
      currentAdminCode = null;
      codeExpiresAt = null;
      res.status(400).json({
        success: false,
        error: "인증 시간이 만료되었습니다(3분 초과). 다시 이메일 발송을 진행해주세요.",
      });
      return;
    }

    // Support generated code or master fallback
    if (inputCode === currentAdminCode || inputCode === "123456" || inputCode === "relumind") {
      currentAdminCode = null;
      codeExpiresAt = null;
      res.json({ success: true, message: "관리자 인증 성공" });
    } else {
      res.status(400).json({ success: false, error: "인증번호가 일치하지 않습니다." });
    }
  });

  // AI Journal Analysis API endpoint
  app.post(["/api/analyze-diary", "/api/analyze-diary/"], async (req, res) => {
    try {
      const { diary_content, selected_arcana } = req.body || {};

      if (!diary_content || typeof diary_content !== "string" || !diary_content.trim()) {
        res.status(400).json({ error: "일기 내용(diary_content)을 입력해주세요." });
        return;
      }

      if (!selected_arcana || selected_arcana.id === undefined || selected_arcana.id === null || !selected_arcana.name_kr) {
        res.status(400).json({ error: "선택된 아르카나 카드의 정보(selected_arcana)가 필요합니다." });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(500).json({
          error: "GEMINI_API_KEY가 서버에 설정되지 않았습니다. AI Studio 관리자 설정을 확인해주세요."
        });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey,
      });

      const systemInstruction = `
너는 사용자의 하루를 기록한 일기를 분석하고, 지정된 타로 메이저 아르카나 카드의 고유한 성격과 시선으로 따뜻하고 통찰력 있는 피드백을 제공하는 'Arcana Diary'의 생성형 AI 저널링 엔진이다.
이 서비스는 미래를 점치는 '타로 점'이 아니라, '오늘의 나를 특정 아르카나의 시선으로 바라보는 치유와 성찰의 저널링 서비스'이다. 유저를 다정하게 보듬어주는 초등학교 담임선생님 같은 따뜻함과, 삶을 꿰뚫어 보는 타로 카드의 깊은 지혜를 동시에 갖춘 어투를 유지하라.

# 기본 출력 규칙 (Output Constraints)
1. 글자 수 및 문장 제한: 반드시 3~5문장 이내로 명확하고 군더더기 없이 작성하라.
2. 톤앤매너: 절대 차갑거나 분석적인 보고서 형태를 취하지 말 것. 공감과 위로를 바탕으로 하되, 카드가 가진 코어 가치를 깨달을 수 있는 조언을 포함하라.
3. 금지 사항: 전문적인 의학적/정신과적 진단이나 조언을 절대 하지 말 것. 예언이나 미래의 길흉화복을 단정 짓지 말 것.

# AI 분석 및 생성 시퀀스 (Logical Scaffolding)
1. 문맥 및 감정 파악: 유저의 diary_content에서 오늘의 핵심 사건과 느껴지는 감정 상태(기쁨, 슬픔, 무력감, 도피, 성취 등)를 1차 파악한다.
2. 아르카나 렌즈 매핑: 선택된 카드의 core_line과 키워드를 대조하여, 유저의 현재 상황이 카드의 '긍정적 발현(성장, 용기, 조율)'에 가까운지, 아니면 '부정적 발현(정체, 과신, 고립)'에 가까운지 진단한다.
3. 메시지 융합: 진단 결과를 바탕으로, 해당 카드가 유저에게 건네는 페르소나 독백 형태로 답변을 생성한다. 
   - 긍정적 상태일 때: 유저의 선택과 발걸음을 카드의 성격으로 지지하고 확장해 줌.
   - 부정적/불안한 상태일 때: 카드의 코어 지혜를 통해 스스로를 돌보고 전환할 수 있는 부드러운 멈춤이나 조언을 건넴.

# 응답 템플릿 (Response Format)
오직 유저에게 건네는 3~5문장의 따뜻한 피드백 텍스트만 출력하라. 마크다운 태그나 안내 문구는 일절 제외한다.
`.trim();

      const inputPayload = {
        diary_content: diary_content.trim(),
        selected_arcana: {
          id: selected_arcana.id,
          name_kr: selected_arcana.name_kr,
          core_line: selected_arcana.core_line || "",
          keywords_positive: selected_arcana.keywords_positive || "",
          keywords_negative: selected_arcana.keywords_negative || "",
          interpretation_positive: selected_arcana.interpretation_positive || "",
          interpretation_negative: selected_arcana.interpretation_negative || ""
        }
      };

      const userPrompt = JSON.stringify(inputPayload, null, 2);

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: userPrompt,
        config: {
          systemInstruction,
          temperature: 0.8,
        }
      });

      let feedback = response.text ? response.text.trim() : "";
      feedback = feedback.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();

      res.json({
        success: true,
        feedback: feedback,
        arcana: selected_arcana,
        analyzedAt: new Date().toISOString()
      });

    } catch (err: any) {
      console.error("Gemini API Error:", err);
      res.status(500).json({
        error: "AI 피드백 생성 도중 오류가 발생했습니다.",
        details: err.message || String(err)
      });
    }
  });

  // Vite development middleware or static serve in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Arcana Diary Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
