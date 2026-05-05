'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, MapPin, Loader2, Store } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface AddressDoc {
  address_name: string;
  x: string; // longitude
  y: string; // latitude
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
  const [noKey, setNoKey] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (q: string) => {
    if (!q || q.length < 2) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/kakao/address?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (data.error && data.error.includes('미설정')) { setNoKey(true); return; }
      setResults(data.documents ?? []);
      setOpen((data.documents ?? []).length > 0);
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
    } finally {
      setNearbyLoading(false);
    }
  };

  const handleInput = (val: string) => {
    setQuery(val);
    onChange('');
    setNearbyCafeCount(null);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => search(val), 400);
  };

  const handleSelect = (doc: AddressDoc) => {
    setQuery(doc.address_name);
    onChange(doc.address_name);
    setResults([]);
    setOpen(false);
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

  if (noKey) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-center">
        <p className="text-xs text-slate-400">
          주소 검색을 사용하려면 <code className="bg-slate-100 px-1 rounded">KAKAO_REST_API_KEY</code>를 설정하세요.
        </p>
        <a
          href="https://developers.kakao.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:underline mt-1 block"
        >
          카카오 개발자 센터에서 무료 발급 →
        </a>
        <Input
          className="mt-3 text-sm"
          placeholder="직접 주소 입력 (선택)"
          value={query}
          onChange={(e) => { setQuery(e.target.value); onChange(e.target.value); }}
        />
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

      {open && (
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

      {value && (
        <div className="flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2">
          <MapPin className="h-4 w-4 text-blue-500 flex-shrink-0" />
          <span className="text-sm text-blue-700 font-medium">{value}</span>
          {nearbyLoading && <Loader2 className="h-3.5 w-3.5 text-blue-400 animate-spin ml-auto" />}
          {nearbyCafeCount !== null && !nearbyLoading && (
            <div className="ml-auto flex items-center gap-1 text-xs text-blue-600">
              <Store className="h-3.5 w-3.5" />
              반경 500m 내 카페 <strong>{nearbyCafeCount}개</strong> 자동 입력
            </div>
          )}
        </div>
      )}
    </div>
  );
}
