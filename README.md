# Portfolio and BIZ map demo / 포트폴리오·상권 데모

Static HTML, CSS, and JavaScript pages currently present on `main`:

| Location | Contents |
| --- | --- |
| `index.html`, `style.css`, `script.js` | Personal portfolio with responsive navigation and section animations |
| `bizmap/` | Interactive business-map and report UI using predefined regions and categories |

한국어: 현재 main에는 개인 포트폴리오와 상권 보고서 화면 데모가 있습니다.
상권 보고서의 숫자는 시드 기반으로 생성하는 예시 값입니다.

## Run locally / 로컬 실행

From the repository root, use Python 3's standard-library server:

```sh
python -m http.server 8000 --bind 127.0.0.1
```

Use `python3` instead of `python` if that is your Python 3 command.

- Portfolio: http://127.0.0.1:8000/
- BIZ map: http://127.0.0.1:8000/bizmap/

No build step or Node package installation is required.

한국어: 저장소 루트에서 서버를 실행한 뒤 위 주소를 엽니다.
별도의 빌드 과정은 없습니다.

## BIZ map behavior / 데모 동작

Select a region and business category from the suggestions, then generate
a report. The UI displays example sales, traffic, age distribution,
business counts, grades, and charts. The same region/category pair
generates stable demo numbers.

See [the BIZ map guide](bizmap/README.md) and
[report-generation source](bizmap/app.js).

## Limits / 사용 범위

- Report numbers are generated demo values, not measured market data
  or validated forecasts.
- Highlight polygons are generated illustrations, not official boundaries.
- Leaflet and Chart.js are bundled. Map tiles use OpenStreetMap, Esri,
  or OpenTopoMap; the pages also request Google Fonts. Network access
  is needed for these external resources.
- The five-report counter is stored in the browser's localStorage and
  keyed by UTC date. It is a demo counter, not account-based quota enforcement.
- BIZ map's login, pricing, and several navigation links are placeholders.

한국어: 보고서 숫자와 표시 영역은 시연용입니다. 실제 상권 통계나 공식
경계로 사용하지 마세요. 지도 타일과 글꼴은 외부 서버에서 불러옵니다.

## Proposed work / 제안 작업

[Open pull requests](https://github.com/qorud02/desktop-tutorial/pulls)
include separate proposed applications. Their files are not part of the
current `main` contents listed above.
