# Planin 2000 - Modo Desenvolvimento

## Problema com Content Security Policy (CSP)

Se você estiver enfrentando erros relacionados a CSP como:

```
Refused to connect to 'ws://127.0.0.1:3002/...' because it violates the following Content Security Policy directive...
```

Há duas soluções disponíveis:

## Solução 1: Usar o modo de desenvolvimento sem CSP

Para desenvolvimento local, você pode usar o arquivo `dev.html` em vez do `index.html`:

```
# Abrir no navegador diretamente
http://localhost:5500/planin-front/dev.html

# Ou usando um servidor local
npx http-server -o dev.html
```

Este arquivo não tem restrições de CSP, o que é útil para desenvolvimento rápido e testes.

## Solução 2: Configurar o navegador para desabilitar CSP

Se você estiver usando o Chrome, você pode iniciar com a flag de desabilitar o CSP:

```
# Windows
"C:\Program Files\Google\Chrome\Application\chrome.exe" --disable-web-security --user-data-dir="C:/Chrome dev session"

# Mac
open -a "Google Chrome" --args --disable-web-security --user-data-dir="/tmp/chrome_dev_session"

# Linux
google-chrome --disable-web-security --user-data-dir="/tmp/chrome_dev_session"
```

## Funcionamento em modo local

Para desenvolvimento local:

1. Inicie o servidor backend:
   ```
   cd planin-back
   npm start
   ```

2. Use o arquivo `dev.html` para acessar o frontend sem restrições de CSP

3. As imagens SVG e outros recursos estáticos são servidos pelo servidor backend

4. No modo de desenvolvimento, o contador de visitantes mostrará valores aleatórios com a tag "(DEV)"

## Observações importantes

- O modo `dev.html` não deve ser usado em produção pois não tem as proteções de segurança necessárias
- O app está configurado para detectar automaticamente ambiente de desenvolvimento quando executado em localhost
- Se você modificar os arquivos SVG, pode ser necessário reiniciar o servidor para que as alterações sejam refletidas 