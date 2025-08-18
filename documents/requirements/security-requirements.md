# Security Agent Requirements

## Role and Responsibilities
Security design for TutorConnect platform, GDPR compliance, user data protection, vulnerability analysis, and security monitoring

## Security Architecture Requirements

### 1. Authentication & Authorization

#### User Authentication
- **Password Policy**
  - Minimum 8 characters, combination of uppercase/lowercase/numbers/special characters
  - bcrypt hashing (rounds: 12)
  - Prevent password reuse (recent 5)

- **Email Verification**
  - Email verification required upon registration
  - Verification token validity: 24 hours
  - Token reissue limit: 5-minute cooldown

- **Session Management**
  - JWT token-based authentication
  - Access Token: 15-minute validity
  - Refresh Token: 7-day validity, HTTP-only cookie
  - Concurrent login limit: Maximum 3 devices

#### Access Control
- **Role-Based Access Control (RBAC)**
  - User, Admin role distinction
  - Resource-level permission matrix
  - API endpoint-level permission verification

- **Resource-Level Authorization**
  - Post edit/delete: Author only
  - Chat access: Participants only
  - Profile information: Based on privacy settings

### 2. Data Protection

#### Personal Information Protection
- **Sensitive Data Encryption**
  - Personal information: AES-256-GCM encryption
  - File upload: Server-side encryption
  - Communication: TLS 1.3 enforcement

- **Data Classification**
  - Public: Name, profile picture (when public setting)
  - Private: Email, birth date, gender
  - Sensitive: Documents, education information
  - Internal: Hashed passwords, tokens

#### GDPR Compliance
- **Data Processing Principles**
  - Lawfulness, fairness, transparency
  - Purpose limitation and data minimization
  - Accuracy and storage limitation

- **User Rights**
  - Right of access (data download)
  - Right to rectification (profile editing)
  - Right to erasure (account deletion)
  - Right to data portability (data export)
  - Right to object (marketing opt-out)

#### 데이터 보관 정책
- **사용자 데이터**: 계정 삭제시 즉시 삭제
- **메시지 데이터**: 3년 보관 후 자동 삭제
- **로그 데이터**: 1년 보관 후 자동 삭제
- **증빙서류**: 사용자 요청시 즉시 삭제

### 3. 입력 검증 및 보안 (Input Validation & Security)

#### 입력 검증
- **Server-side Validation**
  - Zod 스키마 기반 검증
  - 모든 API 입력값 검증
  - 파일 업로드 검증 (타입, 크기, 내용)

- **XSS 방지**
  - 사용자 입력 sanitization
  - Content Security Policy (CSP) 설정
  - DOM-based XSS 방지

- **SQL Injection 방지**
  - Prisma ORM 사용 (parameterized queries)
  - 동적 쿼리 금지
  - 입력값 escape 처리

#### 파일 업로드 보안
- **파일 검증**
  - MIME 타입 검증
  - 파일 시그니처 검증
  - 악성 파일 스캔
  - 크기 제한: 10MB

- **저장소 보안**
  - Supabase Storage 권한 설정
  - 파일 URL 인증 필요
  - 임시 URL 생성 (만료시간 설정)

### 4. API 보안 (API Security)

#### Rate Limiting
- **요청 제한**
  - 로그인: 5회/분
  - 회원가입: 3회/시간
  - 이메일 발송: 5회/시간
  - 일반 API: 100회/분

- **DDoS 방지**
  - Vercel 내장 DDoS 보호
  - Rate limiting middleware
  - IP 차단 기능

#### API 보안 헤더
```typescript
// Security Headers
const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
};
```

### 5. 실시간 채팅 보안

#### 메시지 보안
- **메시지 암호화**
  - 전송중 암호화: WSS (TLS)
  - 저장시 암호화: 데이터베이스 레벨
  - 종단간 암호화 (향후 확장)

- **스팸 방지**
  - 메시지 빈도 제한
  - 욕설/스팸 키워드 필터링
  - 신고 기능 구현

#### 채팅방 보안
- **접근 제어**
  - 참여자만 메시지 조회
  - 초대 링크 보안
  - 채팅방 나가기 기능

### 6. 모니터링 및 로깅

#### 보안 이벤트 로깅
- **인증 이벤트**
  - 로그인/로그아웃
  - 비밀번호 변경
  - 계정 잠금/해제

- **권한 이벤트**
  - 권한 변경
  - 비인가 접근 시도
  - 관리자 작업

- **데이터 접근 로그**
  - 민감 데이터 접근
  - 데이터 다운로드
  - 파일 업로드/삭제

#### 보안 모니터링
- **실시간 알림**
  - 비정상적 로그인 패턴
  - 대량 API 요청
  - 보안 이벤트 발생

- **보안 대시보드**
  - 로그인 통계
  - 에러율 모니터링
  - 보안 이벤트 추이

### 7. 취약점 관리

#### 의존성 관리
- **패키지 보안**
  - `npm audit` 정기 실행
  - Dependabot 자동 업데이트
  - 취약한 패키지 교체

- **코드 스캔**
  - SAST (Static Application Security Testing)
  - 코드 리뷰 보안 체크리스트
  - 자동화된 보안 테스트

#### 펜테스트 준비
- **보안 테스트 계획**
  - 주요 기능별 테스트 시나리오
  - OWASP Top 10 체크리스트
  - 모의해킹 대응 방안

### 8. 인시던트 대응

#### 보안 인시던트 대응 계획
- **대응 절차**
  1. 인시던트 탐지 및 분석
  2. 영향 범위 평가
  3. 즉시 대응 조치
  4. 복구 및 정상화
  5. 사후 분석 및 개선

- **커뮤니케이션**
  - 내부 에스컬레이션 절차
  - 사용자 공지 방안
  - 규제 기관 신고 절차

### 9. 프라이버시 보호

#### Cookie 정책
- **필수 쿠키**: 인증, 세션 관리
- **기능 쿠키**: 사용자 설정
- **쿠키 배너**: GDPR 준수
- **동의 관리**: 세분화된 동의 옵션

#### 데이터 처리 동의
- **명시적 동의**: 개인정보 처리 동의
- **선택적 동의**: 마케팅, 분석
- **동의 철회**: 언제든 철회 가능
- **동의 기록**: 법적 증빙 보관

### 10. 보안 설정 권장사항

#### 환경 변수 관리
```bash
# 필수 보안 환경 변수
NEXTAUTH_SECRET=랜덤_64자리_문자열
ENCRYPTION_KEY=AES_256_키
DATABASE_URL=암호화된_연결_문자열
SUPABASE_SERVICE_ROLE_KEY=서비스_역할_키
```

#### Supabase 보안 설정
- **Row Level Security (RLS)** 활성화
- **서비스 역할 키** 백엔드에서만 사용
- **anon 키** 제한적 사용
- **실시간 구독** 보안 정책 적용

### 11. 컴플라이언스

#### 노르웨이 개인정보보호법
- **Personopplysningsloven** 준수
- **데이터 보호 영향 평가 (DPIA)** 수행
- **개인정보 보호책임자 (DPO)** 지정 고려

#### 보안 인증 준비
- **ISO 27001** 준수 고려
- **SOC 2** 보안 통제
- **보안 감사** 정기 실시

### 12. 사용자 교육

#### 보안 가이드라인
- **강력한 비밀번호** 설정 안내
- **피싱 공격** 주의사항
- **개인정보 보호** 모범 사례
- **의심스러운 활동** 신고 방법

이러한 보안 요구사항을 통해 사용자 데이터를 안전하게 보호하고 노르웨이 법규를 준수하는 플랫폼을 구축할 수 있습니다.