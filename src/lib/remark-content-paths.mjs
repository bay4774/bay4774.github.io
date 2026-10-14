// Resolve Markdown links and media during the build, including without JS.
export default function remarkContentPaths({ base = '/' } = {}) {
  const prefix = '/' + base.replace(/^\/+|\/+$/g, '');
  return function transform(tree) {
    if (prefix === '/') return;
    function visit(node) {
      if ((node.type === 'link' || node.type === 'image' || node.type === 'definition') &&
          typeof node.url === 'string' && node.url.startsWith('/') && !node.url.startsWith('//')) {
        node.url = `${prefix}${node.url}`;
      }
      node.children?.forEach(visit);
    }
    visit(tree);
  };
}
