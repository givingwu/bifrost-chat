#!/bin/bash

###############################################################################
# Bifrost Chat 自动同步脚本
# 功能：在本端构建后同步 dist 目录到 fox-admin-ui/packages/bifrost-chat
###############################################################################

# 注意：不使用 set -e，以便在最后统一处理错误

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 配置
SOURCE_DIR="/Users/cheng/Development/WorkSpace/feoe/bifrost-chat"
TARGET_DIR="/Users/cheng/Development/WorkSpace/fox/fox-admin-ui/packages/bifrost-chat"
LOG_FILE="/tmp/bifrost-sync.log"

# 错误标志
BUILD_FAILED=false
SYNC_FAILED=false
INSTALL_FAILED=false

###############################################################################
# 通知函数 (macOS)
###############################################################################

notify_user() {
    local title="$1"
    local message="$2"
    local is_error="${3:-false}"

    # 使用 macOS 自带的通知中心
    osascript -e "display notification \"$message\" with title \"$title\" sound name \"$([ "$is_error" = "true" ] && echo "Basso" || echo "Glass")\""
}

###############################################################################
# 日志函数
###############################################################################

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

###############################################################################
# 主函数
###############################################################################

main() {
    echo "========================================" > "$LOG_FILE"
    echo "同步开始时间: $(date '+%Y-%m-%d %H:%M:%S')" >> "$LOG_FILE"
    echo "========================================" >> "$LOG_FILE"

    log_info "Bifrost Chat 自动同步脚本启动"

    # 检查目标目录
    if [ ! -d "$TARGET_DIR" ]; then
        log_error "目标目录不存在: $TARGET_DIR"
        exit 1
    fi

    # 在本端构建
    log_info "开始构建..."
    cd "$SOURCE_DIR" || exit 1
    pnpm build >> "$LOG_FILE" 2>&1

    if [ $? -ne 0 ]; then
        log_error "构建失败"
        BUILD_FAILED=true
    else
        log_success "构建完成"
    fi

    # 如果构建失败，跳过后续步骤并通知用户
    if [ "$BUILD_FAILED" = true ]; then
        log_error "同步中止：构建失败"
        notify_user "Bifrost 构建失败" "请检查构建错误并修复" true
        exit 1
    fi

    # 清理目标目录（删除旧的 dist 和 node_modules）
    log_info "清理目标目录..."
    rm -rf "$TARGET_DIR/dist" "$TARGET_DIR/node_modules" 2>/dev/null || true

    # 同步 dist 目录（强制复制，不跳过已有文件）
    # -I: 忽略修改时间和大小，强制复制所有文件
    log_info "同步 dist/ 目录到目标位置..."
    rsync -avI \
        "$SOURCE_DIR/dist/" "$TARGET_DIR/dist/" \
        2>&1 | tee -a "$LOG_FILE"

    if [ $? -ne 0 ]; then
        log_error "文件同步失败"
        SYNC_FAILED=true
    fi

    # 复制 package.json（npm package 需要）
    log_info "同步 package.json..."
    cp "$SOURCE_DIR/package.json" "$TARGET_DIR/package.json"

    # 如果同步失败，跳过安装步骤并通知用户
    if [ "$SYNC_FAILED" = true ]; then
        log_error "同步中止：文件同步失败"
        notify_user "Bifrost 同步失败" "文件同步步骤出错" true
        exit 1
    fi

    # 在目标位置安装依赖（使用 filter 只安装 bifrost-chat）
    log_info "在目标位置安装依赖..."
    cd "$TARGET_DIR/.." || exit 1
    pnpm i --filter @feoe/bifrost-chat >> "$LOG_FILE" 2>&1

    if [ $? -ne 0 ]; then
        log_error "依赖安装失败"
        INSTALL_FAILED=true
    else
        log_success "依赖安装完成"
    fi

    # 如果安装失败，通知用户
    if [ "$INSTALL_FAILED" = true ]; then
        notify_user "Bifrost 同步部分失败" "依赖安装失败，请手动检查" true
    else
        log_success "========================================"
        log_success "同步完成时间: $(date '+%Y-%m-%d %H:%M:%S')"
        log_success "========================================"
        notify_user "Bifrost 同步完成" "已成功同步到 fox-admin-ui" false
    fi

    log_info "日志文件: $LOG_FILE"
}

main "$@"
