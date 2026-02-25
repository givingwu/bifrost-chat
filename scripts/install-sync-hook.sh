#!/bin/bash

###############################################################################
# Bifrost Chat 同步功能安装脚本
# 功能：一键安装 Git Post-commit Hook，实现自动同步
# 使用：bash scripts/install-sync-hook.sh
###############################################################################

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Bifrost Chat 同步功能安装${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 检查当前目录是否是 git 仓库
if [ ! -d ".git" ]; then
    echo -e "${RED}错误: 当前目录不是 git 仓库${NC}"
    exit 1
fi

# 检查 hook 模板是否存在
if [ ! -f "scripts/git-hooks/post-commit" ]; then
    echo -e "${RED}错误: Hook 模板文件不存在${NC}"
    echo -e "${YELLOW}请确保 scripts/git-hooks/post-commit 文件存在${NC}"
    exit 1
fi

# 检查 pre-push hook 模板是否存在
if [ ! -f "scripts/git-hooks/pre-push" ]; then
    echo -e "${RED}错误: pre-push Hook 模板文件不存在${NC}"
    echo -e "${YELLOW}请确保 scripts/git-hooks/pre-push 文件存在${NC}"
    exit 1
fi

# 复制 hook 到 .git/hooks
echo -e "${BLUE}[1/3]${NC} 复制 Git Hooks..."
cp scripts/git-hooks/post-commit .git/hooks/post-commit
cp scripts/git-hooks/pre-push .git/hooks/pre-push

# 设置执行权限
echo -e "${BLUE}[2/3]${NC} 设置执行权限..."
chmod +x .git/hooks/post-commit .git/hooks/pre-push

# 验证安装
echo -e "${BLUE}[3/3]${NC} 验证安装..."
if [ -x ".git/hooks/post-commit" ] && [ -x ".git/hooks/pre-push" ]; then
    echo -e "${GREEN}✓ Git Hooks 安装成功！${NC}"
else
    echo -e "${RED}✗ Git Hooks 安装失败${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}安装完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}功能说明：${NC}"
echo -e "  • 每次 git commit 后自动同步到 fox-admin-ui"
echo -e "  • 同步后自动执行构建"
echo -e "  • push 到 master 前自动执行 pnpm test，失败则阻止推送"
echo -e "  • 后台异步执行，不阻塞 commit 操作"
echo ""
echo -e "${BLUE}使用方式：${NC}"
echo -e "  1. 正常提交代码，自动触发同步"
echo -e "     ${YELLOW}git add .${NC}"
echo -e "     ${YELLOW}git commit -m \"feat: 添加新功能\"${NC}"
echo ""
echo -e "  2. 手动触发同步"
echo -e "     ${YELLOW}pnpm sync:fox${NC}"
echo ""
echo -e "  3. 查看同步日志"
echo -e "     ${YELLOW}tail -f /tmp/bifrost-sync.log${NC}"
echo ""
echo -e "${BLUE}卸载方式：${NC}"
echo -e "  ${YELLOW}rm .git/hooks/post-commit .git/hooks/pre-push${NC}"
echo ""
echo -e "${BLUE}配置文件：${NC}"
echo -e "  • 同步脚本: ${YELLOW}scripts/sync-to-fox-admin.sh${NC}"
echo -e "  • Hook 模板: ${YELLOW}scripts/git-hooks/post-commit${NC}"
echo -e "  • Hook 模板: ${YELLOW}scripts/git-hooks/pre-push${NC}"
echo -e "  • 详细文档: ${YELLOW}plans/auto-sync-to-fox-admin-ui.md${NC}"
echo ""
