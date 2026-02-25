import React, { useEffect, useRef } from 'react';

interface StorybookEmbedProps {
  storyId: string;
  height?: number;
  title?: string;
  description?: string;
}

function StorybookEmbed({
  storyId,
  height = 500,
  title,
  description,
}: StorybookEmbedProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // 生成 Storybook URL
  const getStorybookUrl = () => {
    const baseUrl =
      process.env.NODE_ENV === 'production'
        ? 'https://your-storybook-url.com'
        : 'http://localhost:6006';
    return `${baseUrl}/iframe.html?id=${storyId}&viewMode=story`;
  };

  return (
    <div className="storybook-embed-container">
      {(title || description) && (
        <div className="storybook-embed-header">
          {title && <h3>{title}</h3>}
          {description && <p>{description}</p>}
        </div>
      )}
      <iframe
        ref={iframeRef}
        src={getStorybookUrl()}
        height={height}
        className="storybook-embed"
        title={`Storybook: ${storyId}`}
        frameBorder="0"
        allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
        sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
      />
    </div>
  );
}

export default StorybookEmbed;
