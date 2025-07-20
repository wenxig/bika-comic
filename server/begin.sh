#!/usr/bin/env zsh
set -e  # 出错时立即退出

# 1. 启动 vite 监听，并放到后台运行
vite build -w &
VITE_PID=$!
echo "vite 监听已启动 (PID=${VITE_PID})"

# 2. 确保在任何退出（包括 Ctrl-C）时都会清理掉后台的 watcher
trap 'echo "\n>>> 杀掉 vite 监听 (PID=${VITE_PID})"; kill ${VITE_PID} 2>/dev/null' EXIT INT TERM

# 3. 在前台运行 wrangler dev
wrangler dev

# 4. 当 wrangler dev 结束时，EXIT trap 会执行：
#    它会杀掉 vite watcher，然后脚本退出。