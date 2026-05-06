'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, MapPin, Loader2, Store, AlertTriangle, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface AddressDoc {
  address_name: string;
  x: string;
  y: string;
  address_type: string;
}

interface Props {
  value: string;
  onChange: (address: string) => void;
  onCoordsFound?: (x: string, y: string) => void;
  onNearbyCafes?: (count: number) => void;
}

type KeyStatus = 'checking' | 'ok' | 'missing';

export function AddressSearch({ value, onChange, onCoordsFound, onNearbyCafes }: Props) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<AddressDoc[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyCafeCount, setNearbyCafeCount] = useState<number | null>(null);
  const [keyStatus, setKeyStatus] = useState<KeyStatus>('checking');
  const [noResults, setNoResults] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 마운트 시 API 키 설정 여부 즉시 확인
  useEffect(() => {
    fetch('/api/kakao/address?q=서울')
      .then((r) => r.json())
      .then((data) => {
        if (data.error?.includes('미설정')) {
          setKeyStatus('missing');
        } else {
          setKeyStatus('ok');
        }
      })
      .catch(() => setKeyStatus('missing'));
  }, []);

  const search = useCallback(async (q: string) => {
    if (!q || q.length < 2) { setResults([]); setOpen(false); setNoResults(false); return; }
    setLoading(true);
    setNoResults(false);
    try {
      const res = await fetch(`/api/kakao/address?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (data.error?.includes('미설정')) { setKeyStatus('missing'); return; }
      const docs: AddressDoc[] = data.documents ?? [];
      setResults(docs);
      if (docs.length > 0) {
        setOpen(true);
        setNoResults(false);
      } else {
        setOpen(false);
        setNoResults(true);
      }
    } catch {
      setKeyStatus('missing');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchNearbyCafes = async (x: string, y: string) => {
    setNearbyLoading(true);
    try {
      const res = await fetch(`/api/kakao/nearby?x=${x}&y=${y}&radius=500`);
      const data = await res.json();
      const count: number = data.meta?.total_count ?? 0;
      setNearbyCafeCount(count);
      onNearbyCafes?.(count);
    } catch {
      // 실패 시 무시
    } finally {
      setNearbyLoading(false);
    }
  };

  const handleInput = (val: string) => {
    setQuery(val);
    onChange('');
    setNearbyCafeCount(null);
    setNoResults(false);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => search(val), 400);
  };

  const handleSelect = (doc: AddressDoc) => {
    setQuery(doc.address_name);
    onChange(doc.address_name);
    setResults([]);
    setOpen(false);
    setNoResults(false);
    onCoordsFound?.(doc.x, doc.y);
    fetchNearbyCafes(doc.x, doc.y);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // API 키 미설정 UI
  if (keyStatus === 'missing') {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-3">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">카카오 API 키가 설정되지 않았습니다</p>
            <p className="text-xs text-amber-600 mt-1">
              <code className="bg-amber-100 px-1 rounded font-mono">KAKAO_REST_API_KEY</code>를{' '}
              <code className="bg-amber-100 px-1 rounded font-mono">.env.local</code>에 추가하고 서버를 재시작하세요.
            </p>
          </div>
        </div>
        <a
          href="https://developers.kakao.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
        >
          카카오 개발자 센터에서 무료 발급 <ExternalLink className="h-3 w-3" />
        </a>
        <Input
          className="text-sm bg-white"
          placeholder="직접 주소 입력 (선택 사항)"
          value={query}
          onChange={(e) => { setQuery(e.target.value); onChange(e.target.value); }}
        />
      </div>
    );
  }

  // 확인 중
  if (keyStatus === 'checking') {
    return (
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 animate-spin" />
        <Input className="pl-9 pr-9 text-slate-300" placeholder="주소 검색 초기화 중..." disabled />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 animate-spin" />
        )}
        <Input
          className="pl-9 pr-9"
          placeholder="도로명·지번 주소 검색 (예: 강남구 테헤란로)"
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
        />
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-50 w-full rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
          {results.map((doc, i) => (
            <button
              key={i}
              type="button"
              className="flex items-start gap-3 w-full px-4 py-3 hover:bg-slate-50 text-left border-b border-slate-50 last:border-0 transition-colors"
              onMouseDown={() => handleSelect(doc)}
            >
              <MapPin className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-slate-700">{doc.address_name}</span>
            </button>
          ))}
        </div>
      )}

      {noResults && query.length >= 2 && !loading && (
        <p className="text-xs text-slate-400 px-1">검색 결과가 없습니다. 더 구체적인 주소를 입력해보세요.</p>
      )}

      {value && (
        <div className="flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2">
          <MapPin className="h-4 w-4 text-blue-500 flex-shrink-0" />
          <span className="text-sm text-blue-700 font-medium truncate">{value}</span>
          {nearbyLoading && <Loader2 className="h-3.5 w-3.5 text-blue-400 animate-spin ml-auto flex-shrink-0" />}
          {nearbyCafeCount !== null && !nearbyLoading && (
            <div className="ml-auto flex items-center gap-1 text-xs text-blue-600 flex-shrink-0">
              <Store className="h-3.5 w-3.5" />
              반경 500m 카페 <strong>{nearbyCafeCount}개</strong>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
