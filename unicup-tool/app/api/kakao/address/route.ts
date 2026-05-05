import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim();
  if (!q) return NextResponse.json({ documents: [] });

  const key = process.env.KAKAO_REST_API_KEY;
  if (!key) {
    return NextResponse.json({ documents: [], error: 'KAKAO_REST_API_KEY 미설정' });
  }

  try {
    const res = await fetch(
      `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(q)}&size=7`,
      { headers: { Authorization: `KakaoAK ${key}` }, next: { revalidate: 0 } }
    );
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ documents: [], error: '주소 검색 실패' });
  }
}
