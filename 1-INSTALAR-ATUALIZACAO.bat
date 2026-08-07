@echo off
chcp 65001 >nul
title TOREZANI - Instalar atualizacao
color 0B

echo.
echo ============================================================
echo   TOREZANI - INSTALAR ATUALIZACAO NA SUA MAQUINA
echo ============================================================
echo.
echo   Este programa faz 5 coisas, no seu computador:
echo.
echo     1. Instala as dependencias do projeto
echo     2. Gera o cliente do banco de dados
echo     3. Aplica as mudancas no banco LOCAL
echo     4. Compila a API
echo     5. Compila o site
echo.
echo   NAO mexe no site que esta no ar.
echo   NAO mexe no banco de producao.
echo.
echo ------------------------------------------------------------
pause
echo.

set "RAIZ=%~dp0"
cd /d "%RAIZ%"
if not exist package.json goto erro_pasta
if not exist "apps\api\package.json" goto erro_pasta

echo.
echo [1/5] Instalando dependencias... (pode demorar alguns minutos)
echo ------------------------------------------------------------
call npm install
if errorlevel 1 goto erro

REM As etapas 2 e 3 rodam DE DENTRO de apps\api: e la que fica o
REM arquivo .env com o endereco do banco local. Rodar da raiz falha
REM com "Environment variable not found: DATABASE_URL".
cd /d "%RAIZ%apps\api"

echo.
echo [2/5] Gerando cliente do banco...
echo ------------------------------------------------------------
call npx prisma generate
if errorlevel 1 goto erro

echo.
echo [3/5] Aplicando as mudancas no banco local...
echo ------------------------------------------------------------
call npx prisma migrate dev --name historico_e_relatorio
if errorlevel 1 goto erro_banco

cd /d "%RAIZ%"

echo.
echo [4/5] Compilando a API...
echo ------------------------------------------------------------
call npm run build --workspace apps/api
if errorlevel 1 goto erro

echo.
echo [5/5] Compilando o site...
echo ------------------------------------------------------------
call npm run build --workspace apps/web
if errorlevel 1 goto erro

echo.
echo ============================================================
color 0A
echo   TUDO CERTO!
echo ============================================================
echo.
echo   Para ver o sistema rodando na sua maquina, abra o
echo   arquivo 4-TESTAR-NA-MINHA-MAQUINA.bat
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
pause
exit /b 1

:erro_banco
color 0C
echo.
echo ============================================================
echo   ERRO AO ACESSAR O BANCO LOCAL
echo ============================================================
echo.
echo   Causas mais comuns:
echo     - o banco de dados local nao esta rodando
echo       (se voce usa Docker, rode: npm run db:up)
echo     - o arquivo apps\api\.env esta sem DATABASE_URL
echo.
echo   O banco de PRODUCAO nao foi tocado.
echo   Tire um print e mande no chat.
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
