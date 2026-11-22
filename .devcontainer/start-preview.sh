#!/usr/bin/env bash
# Codespace 시작 때마다 실행: 저장소 루트를 8765 포트로 서비스하고 미리보기 주소를 출력한다.
# 포트 공개 범위는 건드리지 않는다(Codespaces 기본값 = private, 내 GitHub 계정만 접속).
cd "$(dirname "$0")/.." || exit 1
PORT=8765
if ! (echo > "/dev/tcp/127.0.0.1/$PORT") 2>/dev/null; then
  nohup python3 -m http.server "$PORT" --bind 0.0.0.0 > /tmp/ep01-preview.log 2>&1 &
  sleep 1
fi
if [ -n "$CODESPACE_NAME" ] && [ -n "$GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN" ]; then
  BASE="https://${CODESPACE_NAME}-${PORT}.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"
else
  BASE="http://localhost:${PORT}"
fi
{
  echo "EP01 미리보기 서버 실행 중 (포트 $PORT, 비공개)"
  echo "감상용      : ${BASE}/index.html#ep01v3"
  echo "컷 번호 표시: ${BASE}/index.html?review=1#ep01v3"
} | tee "$HOME/EP01_PREVIEW_LINKS.txt"
