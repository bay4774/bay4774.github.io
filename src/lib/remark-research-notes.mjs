// A small Markdown extension: standalone :::my-take … ::: delimiters.
export default function remarkResearchNotes() {
  return function transform(tree) {
    function marker(node) {
      return node.type === 'paragraph' && node.children?.length === 1 &&
        node.children[0].type === 'text' ? node.children[0].value.trim() : '';
    }
    function visit(parent) {
      if (!parent.children) return;
      for (let i = 0; i < parent.children.length; i++) {
        const child = parent.children[i];
        if (marker(child) === ':::my-take') {
          let end = i + 1;
          while (end < parent.children.length && marker(parent.children[end]) !== ':::') end++;
          if (end < parent.children.length) {
            const note = {
              type: 'blockquote',
              data: { hName: 'aside', hProperties: { className: ['research-note'], role: 'note' } },
              children: [
                { type: 'paragraph', data: { hProperties: { className: ['research-note-title'] } },
                  children: [{ type: 'text', value: '✦ RESEARCHER’S NOTE · 我的洞察' }] },
                ...parent.children.slice(i + 1, end),
              ],
            };
            parent.children.splice(i, end - i + 1, note);
            visit(note);
            continue;
          }
        }
        visit(child);
      }
    }
    visit(tree);
  };
}
