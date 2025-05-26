bun ./script/build.sh
git add .
git commit -m `bun ./script/getVersion.ts`
git push origin main
bunx surge dist bika-comic.surge.sh
bunx xmit bika-comic.xmit.dev@131





# bunx wrangler pages deploy dist