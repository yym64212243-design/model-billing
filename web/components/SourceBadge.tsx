/**
 * 显示用户来源（Chrome 扩展 + host/path）
 */
interface SourceBadgeProps {
  source?: string | null;
  host?: string | null;
  path?: string | null;
}

export default function SourceBadge({ source, host, path }: SourceBadgeProps) {
  if (!source && !host) return null;

  return (
    <p className="text-center text-sm text-gray-500">
      You opened billing from another app
      {host && (
        <span className="ml-1 text-gray-400">
          ({host}
          {path && path !== '/' ? path : ''})
        </span>
      )}
    </p>
  );
}
