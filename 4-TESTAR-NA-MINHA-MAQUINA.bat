@echo off
chcp 65001 >nul
title TOREZANI - Testar na minha maquina
color 0B

echo.
echo ============================================================
echo   TOREZANI - RODAR NA SUA MAQUINA
echo ============================================================
echo.
echo   Vai abrir a API e o site no seu computador.
echo   Nada disso afeta o sistema que esta no ar.
echo.
echo   Quando terminar de testar, feche as duas janelas
echo   pretas que serao abertas.
echo.
echo ------------------------------------------------------------
pause

cd /d "%~dp0"
if not exist package.json goto erro_pasta

start "TOREZANI - API" cmd /k "npm run dev:api"
timeout /t 8 /nobreak >nul
start "TOREZANI - SITE" cmd /k "npm run dev:web"

echo.
echo   Aguardando o site subir...
timeout /t 12 /nobreak >nul

start "" "http://localhost:3000"

echo.
color 0A
echo ============================================================
echo   ABERTO NO NAVEGADOR
echo ============================================================
echo.
echo   O QUE CONFERIR:
echo.
echo   1. Entre em Embarcacoes e clique em "Relatorio"
echo      ao lado de um barco
echo.
echo   2. Troque o periodo: 3 meses, 6 meses, Anual,
echo      Quinquenal, Tudo
echo.
echo   3. Clique em "Baixar PDF" e escolha
echo      "Salvar como PDF" na janela do navegador
echo.
echo   4. Abra a ficha do barco e veja se a manutencao
echo      duplicada sumiu da lista
echo.
echo ------------------------------------------------------------
echo   Para PARAR: feche as duas janelas pretas
echo   chamadas "TOREZANI - API" e "TOREZANI - SITE"
echo ------------------------------------------------------------
echo.
pause
exit /b 0

:erro_pasta
color 0C
echo.
echo   ERRO: este arquivo precisa ficar na pasta TOREZANI.
echo.
pause
exit /b 1
