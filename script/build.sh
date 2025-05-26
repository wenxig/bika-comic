bun vite build
wait
cp -v ./dist/index.html ./dist/200.html
cp -v ./dist/index.html ./dist/404.html

cd ../server
bun run build
wait
bun run upload
wait

cd ../html