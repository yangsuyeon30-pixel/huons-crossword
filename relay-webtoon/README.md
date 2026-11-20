# 릴레이 웹툰 이어쓰기 (재작성판)

하나의 웹툰을 팀이 순서대로 이어쓰는 교육용 앱. 컷들을 팀 수대로 연속 구간으로 나누고, 각 팀은 맡은 구간(컷당 말풍선 2개)을 채운 뒤 다음 팀에게 넘긴다.

원본 [relay-webtoon](https://github.com/yangsuyeon30-pixel/relay-webtoon)을 참고해 다시 짠 버전이다. **Supabase 테이블과 데이터 관례는 원본과 똑같아서** 같은 DB를 그대로 쓸 수 있다.

## 파일

| 파일 | 역할 |
|---|---|
| `index.html` | 팀 선택(홈) · 현재 차례 표시 |
| `write.html?team=N` | 팀별 이어쓰기 (자동 저장, 3초마다 차례 확인, 차례가 오면 자기 구간으로 이동) |
| `result.html` | 완성 웹툰 보기 · 인쇄 |
| `admin.html` | 팀 수·컷 수 설정, 현황(3초 자동 갱신), 강제 넘기기/되돌리기/초기화, CSV |
| `common.js` | Supabase 연결, 설정, 구간 계산, 웹툰 렌더링 |
| `check.js` | 문법 + 구간 계산 + 렌더링 검사 (`node relay-webtoon/check.js`) |

## 원본 대비 바뀐 점

- 세 페이지에 복사돼 있던 패널 배지·잠금 판단을 `common.js`의 `webtoonHTML()` 하나로 통합
- upsert, 컷 완료 표시/해제(`markPanels`/`unmarkPanels`), 초기화 감지(`watchReset`)를 공통 함수로 정리
- 작성 화면: 차례가 바뀔 때 쓰던 내용 **저장이 끝난 뒤** 다시 읽어서 마지막 글자가 사라지지 않게 함, 동기화가 겹치지 않게 함
- 작성 화면: 초기화 횟수를 처음 못 읽었을 때 엉뚱하게 "초기화됨"으로 판단하던 문제 수정
- 관리자: 초기화 직전 입력 중이던 화면의 저장이 뒤늦게 도착해도 지워지도록 한 번 더 삭제
- 관리자: 미리보기는 내용이 바뀌었을 때만 다시 그림 (3초마다 이미지가 깜빡이지 않음)
- 저장 상태 표시(`저장됨 ✓`) 스타일이 적용되지 않던 CSS 선택자 수정, 쓰지 않는 CSS 삭제

## 데이터 (Supabase, DDL 없이 관례로 분리)

- `webtoon_config` id=3 팀 수, id=4 컷 수, id=5 초기화 횟수
- `webtoon_bubbles` team_no=0 릴레이 공용 캔버스
- `webtoon_teams` team_no=900+컷번호 완료 표시

자세한 내용은 `supabase/schema.sql`.

## 배포

이 저장소를 Vercel에 배포하면 `/relay-webtoon/`에서 열린다 (루트 `/`는 기존 크로스퍼즐).
