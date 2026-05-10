#!/bin/bash
# English Adventure - Local Dev Server
# Run this script to start the game with HTTPS support for speech recognition

PORT=${1:-8888}

echo "====================================="
echo "  英语大冒险 - English Adventure"
echo "====================================="
echo ""
echo "  打开浏览器访问: http://localhost:$PORT"
echo ""
echo "  提示：语音跟读功能需要使用 HTTPS 或 localhost"
echo "  按 Ctrl+C 停止服务器"
echo "====================================="

python3 -m http.server $PORT
