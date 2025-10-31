# AutoTheme

CSS 변수 기반 라이트/다크/오토 테마 엔진. 시스템 설정과 명암비(prefers-contrast)를 반영해 `--fg`와 `--on-primary`를 WCAG 대비(기본 4.5:1, 고대비 7:1)로 자동 보정합니다.

## 특징
- `light` / `dark` / `auto` 모드
- `prefers-color-scheme`, `prefers-contrast` 감지
- WCAG 대비 자동 보정(`--fg`, `--on-primary`)
- CSS 변수만 출력 → 어떤 UI 프레임워크와도 사용 가능
- 의존성 없음, ESM

## 설치 / 로드
### CDN (메인)
```html
<script type="module" src="autotheme-js.dxdxffg.com/dist/AutoTheme.mjs">// 압축된 상태</script>
<script type="module" src="autotheme-js.dxdxffg.com/AutoTheme.js">// 원본</script>
```

## 빠른 시작

```html
<style>
  :root{
    --bg:#fff; --fg:#111; --primary:#345cff; --on-primary:#fff;
    --muted:#f1f3f7; --accent:#b94cff;
  }
  body{background:var(--bg);color:var(--fg);}
  .btn{background:var(--primary);color:var(--on-primary);}
</style>
<script type="module">
  import Theme from "./AutoTheme.mjs";
  Theme.auto();
  // 수동 전환: Theme.mode('light'|'dark'|'auto')
</script>
```

## API

### `Theme.apply(tokens?)`

토큰을 적용하고 대비를 보정합니다.

* `tokens`: `{ mode?, bg?, fg?, primary?, muted?, accent? }`
* `mode`가 생략되면 저장된 값 또는 시스템 모드를 따릅니다.

### `Theme.auto()`

시스템 모드/대비 변화에 반응하도록 감시를 시작하고 즉시 적용합니다.
`return { stop }` : 감시 중지 함수.

### `Theme.mode(next?)`

모드를 조회/설정합니다.

* `next` 생략 → 현재 모드 반환
* `next` = `'light'|'dark'|'auto'`

### `Theme.persist(boolean)`

로컬스토리지에 모드 저장 여부 설정(기본 `true`).

### `a11yContrast(a, b)`

두 색의 대비비(실수) 반환.

## 출력되는 CSS 변수

| 변수             | 의미              |
| -------------- | --------------- |
| `--bg`         | 배경색             |
| `--fg`         | 본문 텍스트색(보정됨)    |
| `--primary`    | 주요 색            |
| `--on-primary` | 주요 색 위 텍스트(보정됨) |
| `--muted`      | 서브 배경           |
| `--accent`     | 보조 포인트          |

## 동작 원칙

* `--fg`는 `bg` 대비가 4.5:1(고대비 7:1) 이상이 되도록 보정
* `--on-primary`는 `#000`/`#fff` 중 기준 대비를 만족하는 쪽 선택
* `document.documentElement`에 `data-theme`와 `color-scheme` 설정

## 팁

* 저장 끄기: `Theme.persist(false)`
* SSR에서는 클라이언트 진입 시점에 `Theme.apply()` 또는 `Theme.auto()` 호출
* 사용자 색 입력 시 즉시 `Theme.apply({ primary: input.value })` 호출

## 브라우저

* 최신 크로미움/파이어폭스/사파리
* `prefers-contrast` 미지원 환경에서도 정상 동작(기본 4.5:1)

## 라이선스


MIT
