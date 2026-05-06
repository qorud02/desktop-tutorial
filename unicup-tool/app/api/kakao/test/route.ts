import { NextResponse } from 'next/server';

export async function GET() {
  const key = process.env.KAKAO_REST_API_KEY;

  if (!key) {
    return NextResponse.json({ ok: false, step: 'env', message: 'KAKAO_REST_API_KEY가 .env.local에 없습니다.' });
  }

  try {
    const res = await fetch(
      'https://dapi.kakao.com/v2/local/search/address.json?query=서울시청&size=1',
      { headers: { Authorization: `KakaoAK ${key}` } }
    );

    const text = await res.text();
    let data: unknown;
    try { data = JSON.parse(text); } catch { data = text; }

    if (!res.ok) {
      return NextResponse.json({ ok: false, step: 'kakao_api', status: res.status, body: data });
    }

    return NextResponse.json({ ok: true, step: 'success', keyPrefix: key.slice(0, 6) + '...', status: res.status, body: data });
  } catch (e) {
    return NextResponse.json({ ok: false, step: 'network', message: String(e) });
  }
}
