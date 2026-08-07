@echo off
chcp 65001 >nul
title TOREZANI - Enviar atualizacao para o ar
color 0D

echo.
echo ============================================================
echo   TOREZANI - ENVIAR ATUALIZACAO PARA O AR
echo ============================================================
echo.
echo   Este programa envia as mudancas para o GitHub.
echo   O Render detecta e atualiza o site sozinho, em 2 a 4 min.
echo.
echo   O QUE VAI PARA O AR:
echo     - Registro de quem alterou o que (log de auditoria)
echo     - Excluir embarcacao deixa de apagar os dados
echo     - Lixeira e restauracao (somente ADMIN)
echo.
echo   O banco de producao recebe as mudancas sozinho,
echo   sem apagar nada do que ja existe.
echo.
echo ------------------------------------------------------------
echo   ATENCAO: o site pode ficar 1 a 2 minutos fora do ar
echo   durante a atualizacao. Evite horario de uso do cliente.
echo ------------------------------------------------------------
echo.
set "OK="
set /p OK=Digite SIM e aperte ENTER para continuar:
if /I not "%OK%"=="SIM" goto cancelado

cd /d "%~dp0"
if not exist render.yaml goto erro_pasta

echo.
echo [1/4] Conferindo o que mudou...
echo ------------------------------------------------------------
call git status --short
if errorlevel 1 goto erro_git

echo.
echo [2/4] Preparando os arquivos...
echo ------------------------------------------------------------
call git add -A
if errorlevel 1 goto erro

echo.
echo [3/4] Registrando a alteracao...
echo ------------------------------------------------------------
call git commit -m "Fase 0: log de auditoria, exclusao logica de embarcacao e lixeira"
if errorlevel 1 goto nada_a_enviar

echo.
echo [4/4] Enviando para o GitHub...
echo ------------------------------------------------------------
call git push
if errorlevel 1 goto erro_push

echo.
color 0A
echo ============================================================
echo   ENVIADO!
echo ============================================================
echo.
echo   Agora acompanhe a atualizacao no Render:
echo   dashboard.render.com  ^>  torezani-api  ^>  Events
echo.
echo   Espere aparecer "Deploy live". Leva de 2 a 4 minutos.
echo.
echo   Abrindo o Render no navegador...
start "" "https://dashboard.render.com"
pause
exit /b 0

:cancelado
echo.
echo   Cancelado. Nada foi enviado.
echo.
pause
exit /b 0

:nada_a_enviar
color 0E
echo.
echo   Nao havia nada novo para enviar.
echo   As mudancas ja tinham sido registradas antes.
echo.
echo   Tentando enviar mesmo assim...
call git push
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

:erro_git
color 0C
echo.
echo   ERRO: o Git nao respondeu.
echo   Pode ser que ele nao esteja instalado nesta maquina.
echo.
echo   Tire um print e mande no chat.
echo.
pause
exit /b 1

:erro_push
color 0C
echo.
echo ============================================================
echo   ERRO AO ENVIAR
echo ============================================================
echo.
echo   Causa mais comum: falta de login no GitHub.
echo.
echo   O que NAO aconteceu: nada foi para o ar.
echo   O site continua funcionando normalmente.
echo.
echo   Tire um print desta tela e mande no chat.
echo.
pause
exit /b 1

:erro
color 0C
echo.
echo   DEU ERRO. Tire um print e mande no chat.
echo   Nada foi enviado para o ar.
echo.
pause
exit /b 1
