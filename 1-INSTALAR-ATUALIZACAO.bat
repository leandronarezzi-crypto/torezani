@echo off
chcp 65001 >nul
title TOREZANI - Instalar atualizacao (Fase 0)
color 0B

echo.
echo ============================================================
echo   TOREZANI - INSTALAR ATUALIZACAO NA SUA MAQUINA
echo ============================================================
echo.
echo   Este programa faz 4 coisas, no seu computador:
echo.
echo     1. Instala as dependencias do projeto
echo     2. Gera o cliente do banco de dados
echo     3. Cria a tabela de auditoria no banco LOCAL
echo     4. Compila o projeto para conferir se esta tudo certo
echo.
echo   NAO mexe no site que esta no ar.
echo   NAO mexe no banco de producao.
echo.
echo ------------------------------------------------------------
pause
echo.

cd /d "%~dp0apps\api"
if errorlevel 1 goto erro_pasta
if not exist package.json goto erro_pasta

echo.
echo [1/4] Instalando dependencias... (pode demorar alguns minutos)
echo ------------------------------------------------------------
call npm install
if errorlevel 1 goto erro

echo.
echo [2/4] Gerando cliente do banco...
echo ------------------------------------------------------------
call npx prisma generate
if errorlevel 1 goto erro

echo.
echo [3/4] Aplicando as mudancas no banco local...
echo ------------------------------------------------------------
call npx prisma migrate dev --name fase0_blindagem
if errorlevel 1 goto erro

echo.
echo [4/4] Compilando o projeto...
echo ------------------------------------------------------------
call npm run build
if errorlevel 1 goto erro

echo.
echo ============================================================
color 0A
echo   TUDO CERTO!
echo ============================================================
echo.
echo   A atualizacao foi instalada na sua maquina.
echo.
echo   Proximo passo: abra o arquivo 2-FAZER-BACKUP.bat
echo   para salvar os dados do cliente.
echo.
pause
exit /b 0

:erro_pasta
color 0C
echo.
echo ============================================================
echo   ERRO: pasta do projeto nao encontrada
echo ============================================================
echo.
echo   Este arquivo precisa ficar na pasta TOREZANI,
echo   ao lado da pasta "apps".
echo.
echo   Tire um print desta tela e mande no chat.
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
echo   Alguma etapa acima falhou.
echo   Role a tela para cima, tire um print da mensagem
echo   em vermelho e mande no chat.
echo.
echo   Nenhum dado foi perdido. O site no ar nao foi afetado.
echo.
pause
exit /b 1
