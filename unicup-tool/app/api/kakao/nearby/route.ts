import { NextRequest, NextResponse } from 'next/server';

// Category CE7 = 카페
export async function GET(request: NextRequest) {
  const x = request.nextUrl.searchParams.get('x');
  const y = request.nextUrl.searchParams.get('y');
  const radius = request.nextUrl.searchParams.get('radius') ?? '500';

  if (!x || !y) return NextResponse.json({ meta: { total_count: 0 }, documents: [] });

  const key = process.env.KAKAO_REST_API_KEY;
  if (!key) {
    return NextResponse.json({ meta: { total_count: 0 }, error: 'KAKAO_REST_API_KEY 미설정' });
  }

  try {
    const res = await fetch(
      `https://dapi.kakao.com/v2/local/search/category.json?category_group_code=CE7&x=${x}&y=${y}&radius=${radius}&size=15`,
      { headers: { Authorization: `KakaoAK ${key}` }, next: { revalidate: 0 } }
    );
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ meta: { total_count: 0 }, error: '주변 검색 실패' });
  }
}
