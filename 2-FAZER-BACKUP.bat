@echo off
chcp 65001 >nul
title TOREZANI - Backup dos dados do cliente
color 0E

echo.
echo ============================================================
echo   TOREZANI - BACKUP DOS DADOS DO CLIENTE
echo ============================================================
echo.
echo   Este programa BAIXA uma copia de tudo que o cliente
echo   preencheu no sistema e salva no seu computador.
echo.
echo   Ele SOMENTE LE o banco de dados.
echo   Nao altera nada. Nao apaga nada. Risco zero.
echo.
echo ------------------------------------------------------------
echo.
echo   Cole abaixo o endereco do banco (DATABASE_URL).
echo   Ele comeca com postgresql://
echo.
echo   Onde achar: Render ^> torezani-api ^> Environment ^> DATABASE_URL
echo.
echo   DICA: para colar, clique com o BOTAO DIREITO do mouse.
echo.

set "DBURL="
set /p DBURL=Cole aqui e aperte ENTER:

if "%DBURL%"=="" goto sem_url

echo.
echo Conectando e baixando os dados...
echo ------------------------------------------------------------

cd /d "%~dp0apps\api"
if not exist package.json goto erro_pasta

set "DATABASE_URL=%DBURL%"
call npx ts-node scripts/backup-dados.ts
if errorlevel 1 goto erro

echo.
echo ============================================================
color 0A
echo   BACKUP CONCLUIDO!
echo ============================================================
echo.
echo   Os arquivos estao na pasta:
echo   %~dp0apps\api\backups
echo.
echo   Abrindo a pasta para voce conferir...
echo.
start "" "%~dp0apps\api\backups"
pause
exit /b 0

:sem_url
color 0C
echo.
echo   Voce nao colou nada. Rode o programa de novo.
echo.
pause
exit /b 1

:erro_pasta
color 0C
echo.
echo   ERRO: este arquivo precisa ficar na pasta TOREZANI,
echo   ao lado da pasta "apps".
echo.
pause
exit /b 1

:erro
color 0C
echo.
echo ============================================================
echo   DEU ERRO
echo ============================================================
echo.
echo   Causas mais comuns:
echo     - o endereco do banco foi colado pela metade
echo     - falta rodar antes o 1-INSTALAR-ATUALIZACAO.bat
echo.
echo   Tire um print desta tela e mande no chat.
echo   Nenhum dado foi perdido.
echo.
pause
exit /b 1
