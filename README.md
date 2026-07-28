# 🔮 아르카나 기록장 (Arcana Diary)

오늘의 나를 특정 타로 메이저 아르카나의 시선으로 바라보는 치유와 성찰의 생성형 AI 저널링 서비스입니다.

---

## 🚀 시작하기 (Quick Start)

### 1. 의존성 패키지 설치
```bash
npm install
```

### 2. 환경 변수 설정
`.env.example` 파일을 참고하여 프로젝트 루트에 `.env` 파일을 생성하고 Gemini API 키를 입력합니다.

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. 개발 서버 실행
```bash
npm run dev
```
브라우저에서 `http://localhost:3000` 접속하여 실행 확인.

---

## 🛠 빌드 및 프로덕션 실행

```bash
# 빌드
npm run build

# 프로덕션 실행
npm start
```

---

## 🧰 기술 스택
- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Motion
- **Backend**: Express (Vite Middleware Integrated)
- **AI Integration**: Google GenAI SDK (`@google/genai`) - Server-side proxied
