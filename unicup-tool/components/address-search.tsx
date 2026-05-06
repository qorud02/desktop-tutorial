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

export function AddressSearch({ value, onChange, onCoordsFound, onNearbyCafes }: Props) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<AddressDoc[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyCafeCount, setNearbyCafeCount] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [noResults, setNoResults] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (q: string) => {
    if (!q || q.length < 2) {
      setResults([]); setOpen(false); setNoResults(false); setErrorMsg('');
      return;
    }
    setLoading(true);
    setNoResults(false);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/kakao/address?q=${encodeURIComponent(q)}`);
      const data = await res.json();

      if (data.error?.includes('미설정')) {
        setErrorMsg('KAKAO_REST_API_KEY가 .env.local에 없습니다. 직접 주소를 입력하세요.');
        setResults([]); setOpen(false);
        return;
      }
      if (data.error) {
        setErrorMsg(`API 오류: ${data.error}`);
        setResults([]); setOpen(false);
        return;
      }

      const docs: AddressDoc[] = data.documents ?? [];
      setResults(docs);
      if (docs.length > 0) {
        setOpen(true);
      } else {
        setOpen(false);
        setNoResults(true);
      }
    } catch {
      setErrorMsg('네트워크 오류가 발생했습니다. 직접 주소를 입력하세요.');
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
    setErrorMsg('');
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

      {/* 드롭다운 결과 */}
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

      {/* 에러 메시지 */}
      {errorMsg && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
          <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs text-amber-700">{errorMsg}</p>
            {errorMsg.includes('미설정') && (
              <a
                href="https://developers.kakao.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
              >
                카카오 개발자 센터 <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* 결과 없음 */}
      {noResults && !errorMsg && query.length >= 2 && !loading && (
        <p className="text-xs text-slate-400 px-1">검색 결과가 없습니다. 더 구체적인 주소를 입력해보세요.</p>
      )}

      {/* 선택된 주소 */}
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
