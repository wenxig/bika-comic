echo "开始更新"
echo ""
echo ""
cp ./package.json ./script/old_package.json
need_update_list=( "axios" "naive-ui" "pinia" "vant" "vue" "vue-router" "@vant/use" "@vueuse/core" "@vercel/speed-insights" "tailwindcss" "typescript" "vite" "vue-tsc")
for(( i=0;i<${#need_update_list[@]};i++)) do
pnpm i "${need_update_list[i]}@latest"
done;
wait
bun ./script/diffLibVersion.ts ${need_update_list[*]}
echo "更新完成"