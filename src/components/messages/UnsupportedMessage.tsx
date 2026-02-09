/**
 * UnsupportedMessage：不支持的消息类型组件。
 * - 当消息类型无法识别时显示的占位组件。
 */
export const UnsupportedMessage = () => {
  return (
    <p className="text-xs text-gray-400 dark:text-gray-500">
      Unsupported message.
    </p>
  );
};
