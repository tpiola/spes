# SPES — Esperança que se Transforma em Oração

Landing page da jornada gratuita **40 Dias com São Miguel Arcanjo**, de 15 de agosto a 29 de setembro de 2026.

## Objetivo

Reunir ao menos 500 pessoas em uma comunidade de oração no WhatsApp, com oração diária entre 4h e 6h.

## Direção

- identidade sacra editorial: azul profundo, ouro envelhecido e marfim;
- tipografia clássica com leitura contemporânea;
- narrativa acolhedora, bíblica e sem promessas supersticiosas;
- pontos de entrada contextuais para o grupo da SPES, incluindo CTA flutuante;
- arquitetura mobile-first, acessível e sem dependências de build;
- imagens sacras próprias otimizadas em WebP;
- SEO, Open Graph, dados estruturados e eventos de conversão preparados;
- motion design com alternativa para `prefers-reduced-motion`.
- trilha editorial para Santo do Dia, Palavra, homilia dominical e leitura de Fulton Sheen;
- links claros para as transmissões do canal oficial Frei Gilson / Som do Monte;
- cabeçalhos de segurança, cache de imagens, sitemap, robots, manifesto e página 404.

> A SPES é uma comunidade independente e não representa o Frei Gilson ou a Comunidade Som do Monte.

## Publicação

Site estático: publique `index.html` na raiz pública do domínio `spes.blog`.

## Qualidade

```bash
npm ci
npm run validate:html
npm run validate:links
npx playwright install chromium
npm run test:smoke
npm run lighthouse
```

O workflow `Quality` executa essas verificações em cada pull request e push para `main`.
Em produção, o Vercel Web Analytics registra visualizações e cliques nos CTAs do WhatsApp.
