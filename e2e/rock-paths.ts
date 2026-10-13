export function rockPaths(html: string): string[] {
  const links = /<a[^>]*class="[^"]*\bname\b[^"]*"[^>]*href="([^"]+)"/g;
  const paths: string[] = [];
  let match = links.exec(html);
  while (match) {
    paths.push(match[1]);
    match = links.exec(html);
  }
  return paths;
}
