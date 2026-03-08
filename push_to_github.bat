@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: 配置GitHub仓库信息 - 注意检查仓库名是否正确
set REPO_URL=https://github.com/ok-lzr/my-blog.git
set COMMIT_MSG=自动提交: %date% %time%

echo ========================================
echo      开始推送文件到GitHub仓库
echo ========================================
echo.

:: 检查网络连接
echo 检查GitHub连接...
ping -n 1 github.com >nul 2>&1
if !errorlevel! neq 0 (
    echo [警告] 无法ping通github.com，可能网络有问题
    echo 继续尝试连接...
) else (
    echo GitHub连接正常
)
echo.

:: 检查是否已初始化Git仓库
if not exist ".git" (
    echo 初始化Git仓库...
    git init
    if !errorlevel! neq 0 (
        echo [错误] Git初始化失败，请确保已安装Git
        pause
        exit /b 1
    )
)

:: 检查远程仓库是否已配置
git remote -v | find "origin" >nul
if !errorlevel! neq 0 (
    echo 添加远程仓库...
    git remote add origin %REPO_URL%
    if !errorlevel! neq 0 (
        echo [错误] 添加远程仓库失败
        pause
        exit /b 1
    )
) else (
    echo 远程仓库已存在，检查URL是否正确...
    git remote set-url origin %REPO_URL%
)

:: 添加所有文件到暂存区
echo 添加文件到暂存区...
git add .
if !errorlevel! neq 0 (
    echo [错误] 添加文件失败
    pause
    exit /b 1
)

:: 检查是否有文件需要提交
git status | find "nothing to commit" >nul
if !errorlevel! equ 0 (
    echo 没有文件需要提交
) else (
    :: 提交更改
    echo 提交更改...
    git commit -m "%COMMIT_MSG%"
    if !errorlevel! neq 0 (
        echo [错误] 提交失败
        pause
        exit /b 1
    )
)

:: 先尝试拉取最新代码（避免推送失败）
echo 尝试拉取最新代码...
git pull origin master --allow-unrelated-histories --no-rebase
if !errorlevel! neq 0 (
    echo [注意] 拉取失败，可能远程仓库为空或网络问题
    echo 继续尝试推送...
) else (
    echo 拉取成功
)

:: 推送到GitHub
echo 推送到GitHub...
git push -u origin master
if !errorlevel! neq 0 (
    echo [错误] 推送失败
    
    :: 尝试使用HTTPS的备用方案
    echo.
    echo 尝试使用备用方案...
    echo 请尝试以下手动步骤：
    echo ========================================
    echo 1. 检查网络连接：ping github.com
    echo 2. 检查代理设置：git config --global --get http.proxy
    echo 3. 如果使用代理，设置代理：git config --global http.proxy http://127.0.0.1:7890
    echo 4. 取消代理：git config --global --unset http.proxy
    echo 5. 尝试使用SSH方式：git remote set-url origin git@github.com:ok-lzr/speakcoach.git
    echo 6. 然后再运行：git push -u origin master
    echo ========================================
    
    :: 显示当前Git配置
    echo.
    echo 当前Git配置信息：
    git config --list | findstr http.proxy
    git config --list | findstr https.proxy
    
    pause
    exit /b 1
)

echo.
echo ========================================
echo      推送完成！
echo ========================================
echo.
pause