# BIZ map — 상권분석 보고서 데모

NICE bizmap 탐색 화면(https://m.nicebizmap.co.kr/explorer/summary)과 동일한 흐름을 구현한 정적 웹사이트입니다.

## 기능

- **전체 화면 지도** — Leaflet + OpenStreetMap (API 키 불필요), 일반/위성/지형 전환, 줌 컨트롤
- **보고서 생성 패널** — 분석지역(행정동·지하철역) / 분석업종 자동완성 검색
- **지역 하이라이트** — 지역 선택 시 지도 이동 + 상권 영역 폴리곤 표시
- **상권분석 보고서** — 상권 등급, 월 추정 매출, 유동인구, 동일업종 업소 수, 연령대 구성, 입지 평가 차트 (Chart.js)
- **일일 무료 5회 제한** — localStorage 기반, 날짜가 바뀌면 초기화

같은 지역·업종 조합은 항상 같은 보고서가 나오도록 시드 기반 의사난수를 사용합니다.
보고서 수치는 데모용 추정 데이터입니다.

## 실행 방법

빌드 과정 없이 정적 파일만으로 동작합니다.

```bash
cd bizmap
python3 -m http.server 8000
# http://localhost:8000 접속
```

Leaflet과 Chart.js는 `vendor/`에 포함되어 있어 외부 CDN 없이 동작하며,
지도 타일만 OpenStreetMap 서버에서 불러옵니다.
