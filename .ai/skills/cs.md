## 1. 활성화 조건
- 키워드: cs, 문의, 지원, ticket, 고객센터, attachment
- 의도: 문의 CRUD, 상태 관리, 첨부파일 처리
- 작업 위치: `src/domains/cs/`, `src/app/api/cs/`
- 코드 패턴: inquiry 생성/목록/상세/답변

## 2. 필수 패턴
- 문의 상태: 접수/처리중/완료
- 파일 첨부는 Supabase Storage 사용
- 작성자/관리자 권한 분리

## 3. 보안 체크리스트
- [ ] 세션 기반 인증 확인
- [ ] 첨부파일 접근 제어
- [ ] RLS 정책 적용
- [ ] 입력값 검증

## 4. 코드 템플릿
```ts
// src/app/api/cs/inquiry/route.ts
import { NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = getServerSupabaseClient();
  const body = await req.json();
  const { title, content } = body;

  const { data, error } = await supabase
    .from("inquiries")
    .insert({ title, content, status: "접수" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ inquiry: data });
}
```

```ts
// src/app/api/cs/inquiries/route.ts
import { NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase
    .from("inquiries")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ inquiries: data });
}
```

## 5. 테스트 체크리스트
- [ ] 문의 생성 시 상태 접수
- [ ] 목록 정렬/필터 정상
- [ ] 답변/상태 변경 처리
- [ ] 첨부파일 업로드/다운로드 권한 확인
