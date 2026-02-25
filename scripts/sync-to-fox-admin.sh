#!/bin/bash

###############################################################################
# Bifrost Chat 自动同步脚本
# 功能：将当前代码库同步到 fox-admin-ui/packages/bifrost-chat
# 作者：Kilo Code
# 日期：2025-02-10
###############################################################################

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
SOURCE_DIR="/Users/cheng/Development/WorkSpace/feoe/bifrost-chat"
TARGET_DIR="/Users/cheng/Development/WorkSpace/fox/fox-admin-ui/packages/bifrost-chat"
LOG_FILE="/tmp/bifrost-sync.log"
TIMESTAMP_FILE=".sync-timestamp"

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

###############################################################################
# 日志函数
###############################################################################

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

###############################################################################
# 检查函数
###############################################################################

check_directories() {
    log_info "检查目录..."

    # 检查源目录
    if [ ! -d "$SOURCE_DIR" ]; then
        log_error "源目录不存在: $SOURCE_DIR"
        exit 1
    fi

    # 检查目标目录，如果不存在则创建
    if [ ! -d "$TARGET_DIR" ]; then
        log_warning "目标目录不存在，正在创建: $TARGET_DIR"
        mkdir -p "$TARGET_DIR" || {
            log_error "无法创建目标目录"
            exit 1
        }
    fi

    log_success "目录检查完成"
}

check_rsync() {
    log_info "检查 rsync..."

    if ! command -v rsync &> /dev/null; then
        log_error "rsync 未安装，请先安装 rsync"
        log_info "macOS: rsync 通常已预装"
        log_info "Linux: sudo apt-get install rsync 或 sudo yum install rsync"
        exit 1
    fi

    log_success "rsync 已安装: $(rsync --version | head -n 1)"
}

check_pnpm() {
    log_info "检查 pnpm..."

    if ! command -v pnpm &> /dev/null; then
        log_warning "pnpm 未安装，将跳过构建步骤"
        return 1
    fi

    log_success "pnpm 已安装: $(pnpm --version)"
    return 0
}

###############################################################################
# 同步函数
###############################################################################

sync_files() {
    log_info "开始同步文件..."
    log_info "源目录: $SOURCE_DIR"
    log_info "目标目录: $TARGET_DIR"

    # 记录开始时间
    START_TIME=$(date +%s)

    # rsync 同步参数说明：
    # -a: 归档模式，保留文件属性
    # -v: 详细输出
    # --delete: 删除目标目录中源目录没有的文件
    # --exclude: 排除不需要同步的文件和目录
    rsync -av --delete \
        --exclude 'node_modules/' \
        --exclude '.git/' \
        --exclude 'dist/' \
        --exclude '.next/' \
        --exclude 'coverage/' \
        --exclude '*.log' \
        --exclude '.DS_Store' \
        --exclude '.sync-timestamp' \
        --exclude 'plans/' \
        --exclude '.vscode/' \
        --exclude 'stories/' \
        --exclude '.turbo/' \
        --exclude '.cache/' \
        "$SOURCE_DIR/" "$TARGET_DIR/" \
        2>&1 | tee -a "$LOG_FILE"

    # 检查 rsync 是否成功
    if [ ${PIPESTATUS[0]} -eq 0 ]; then
        # 计算耗时
        END_TIME=$(date +%s)
        DURATION=$((END_TIME - START_TIME))

        log_success "文件同步完成 (耗时: ${DURATION}秒)"

        # 记录同步时间戳
        date +"%Y-%m-%d %H:%M:%S" > "$SOURCE_DIR/$TIMESTAMP_FILE"
    else
        log_error "文件同步失败"
        exit 1
    fi
}

###############################################################################
# 构建函数
###############################################################################

build_target() {
    log_info "检查是否需要构建..."

    # 检查目标位置是否有 package.json
    if [ ! -f "$TARGET_DIR/package.json" ]; then
        log_warning "目标位置没有 package.json，跳过构建"
        return
    fi

    # 检查 pnpm 是否可用
    if ! check_pnpm; then
        log_warning "pnpm 不可用，跳过构建"
        return
    fi

    log_info "开始在目标位置执行构建..."

    # 切换到目标目录
    cd "$TARGET_DIR" || {
        log_error "无法切换到目标目录: $TARGET_DIR"
        exit 1
    }

    # 检查是否有构建脚本
    if ! grep -q '"build"' package.json; then
        log_warning "package.json 中没有 build 脚本，跳过构建"
        return
    fi

    # 执行构建
    log_info "执行: pnpm build:css"
    pnpm build:css 2>&1 | tee -a "$LOG_FILE"

    # 检查构建是否成功
    if [ ${PIPESTATUS[0]} -eq 0 ]; then
        log_success "构建完成"
    else
        log_warning "构建失败，但文件已同步"
    fi
}

###############################################################################
# 通知函数
###############################################################################

send_notification() {
    local status=$1
    local message=$2

    # macOS 通知
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if command -v osascript &> /dev/null; then
            osascript -e "display notification \"$message\" with title \"Bifrost Chat 同步\" sound name \"Glass\""
        fi
    fi

    # Linux 通知（需要 libnotify-bin）
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if command -v notify-send &> /dev/null; then
            notify-send "Bifrost Chat 同步" "$message"
        fi
    fi
}

###############################################################################
# 主函数
###############################################################################

main() {
    # 初始化日志
    echo "========================================" > "$LOG_FILE"
    echo "同步开始时间: $(date '+%Y-%m-%d %H:%M:%S')" >> "$LOG_FILE"
    echo "========================================" >> "$LOG_FILE"

    log_info "Bifrost Chat 自动同步脚本启动"

    # 检查环境
    check_directories
    check_rsync

    # 同步文件
    sync_files

    # 构建目标
    build_target

    # 完成
    log_success "========================================"
    log_success "同步完成时间: $(date '+%Y-%m-%d %H:%M:%S')"
    log_success "========================================"

    # 发送通知
    send_notification "success" "同步完成！"

    # 显示日志位置
    echo ""
    log_info "日志文件: $LOG_FILE"
    log_info "查看日志: tail -f $LOG_FILE"
}

###############################################################################
# 执行主函数
###############################################################################

main "$@"
