@echo off
title Labirinto Aventura
cls
echo ===================================================
echo               LABIRINTO AVENTURA
echo ===================================================
echo.
echo Escolha como deseja jogar:
echo.
echo  [1] Versao Web no Navegador (Recomendado - com efeitos sonoros, modo lanterna e controles touch)
echo  [2] Versao Desktop em Python (Tkinter)
echo  [3] Sair
echo.
set /p opcao="Digite a opcao desejada (1, 2 ou 3): "

if "%opcao%"=="1" (
    echo Abrindo no seu navegador padrao...
    start index.html
    exit
)

if "%opcao%"=="2" (
    echo Iniciando versao Python...
    python labirinto.py
    exit
)

if "%opcao%"=="3" (
    exit
)

echo Opcao invalida. Abrindo versao Web por padrao...
start index.html
