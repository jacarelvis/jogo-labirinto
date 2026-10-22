@echo off
title THE LAST CORRIDOR
cls
echo ===================================================================
echo                     THE LAST CORRIDOR
echo          JOGO DE TERROR PSICOLOGICO COM DESKTOP SIMULADO
echo ===================================================================
echo.
echo Escolha como deseja executar:
echo.
echo  [1] Executar aplicativo compilado (.EXE Windows)
echo  [2] Executar versao de desenvolvimento em Python (main.py)
echo  [3] Executar suite de testes automatizados (30 testes)
echo  [4] Sair
echo.
set /p opcao="Digite a opcao desejada (1, 2, 3 ou 4): "

if "%opcao%"=="1" (
    if exist "dist\TheLastCorridor\TheLastCorridor.exe" (
        echo Iniciando TheLastCorridor.exe...
        start "" "dist\TheLastCorridor\TheLastCorridor.exe"
        exit
    ) else (
        echo [ERRO] Executavel nao encontrado em dist\TheLastCorridor\TheLastCorridor.exe.
        pause
        exit
    )
)

if "%opcao%"=="2" (
    echo Iniciando THE LAST CORRIDOR via Python...
    python the_last_corridor\main.py
    exit
)

if "%opcao%"=="3" (
    echo Executando testes unitarios...
    python -m unittest discover -s the_last_corridor\tests
    pause
    exit
)

if "%opcao%"=="4" (
    exit
)

echo Opcao invalida. Iniciando versao executavel por padrao...
start "" "dist\TheLastCorridor\TheLastCorridor.exe"
