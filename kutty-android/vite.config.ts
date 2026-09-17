import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {fileURLToPath,URL} from 'node:url';
export default defineConfig({plugins:[react()],base:'./',resolve:{alias:{'@':fileURLToPath(new URL('./src',import.meta.url))}},build:{target:'es2020',outDir:'dist',rolldownOptions:{input:{main:fileURLToPath(new URL('./index.html',import.meta.url))}}}});
