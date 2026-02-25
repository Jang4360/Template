## CS System Guide

### 개요
- 문의 CRUD와 상태 관리(접수/처리중/완료)를 제공한다.
- 파일 첨부는 Supabase Storage를 사용한다.

### 주요 흐름
1. 문의 생성 (접수 상태)
2. 관리자 답변 및 상태 변경
3. 목록/상세 조회
4. 첨부파일 업로드/다운로드

### 코드 예시
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

### 주의사항
- 상태 값은 정의된 enum만 사용
- 첨부파일 접근 권한 제한
- 작성자/관리자 권한 분리

### 자주 하는 실수
- 상태 변경 이력 누락
- 첨부파일 공개 버킷 사용
- 목록 조회에서 권한 필터 누락
