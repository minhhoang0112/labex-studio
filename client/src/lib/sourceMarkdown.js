// Source snapshots remain byte-for-byte intact. Convert known informational
// HTML alerts for ReactMarkdown without enabling arbitrary HTML execution.
export function sourceMarkdown(text='') {
  return text.split(/(```[\s\S]*?```)/g).map(part=>part.startsWith('```')?part:
    part.replace(/<div\b[^>]*class=["'][^"']*\balert\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi,(_all,body)=>{
      const content=body.replace(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi,'[$2]($1)')
        .replace(/<\/?(?:b|strong)>/gi,'**').replace(/<br\s*\/?>/gi,'\n')
        .replace(/<\/?p\b[^>]*>/gi,'\n').replace(/<[^>]+>/g,'').trim();
      return '\n\n'+content.split('\n').map(line=>'> '+line).join('\n')+'\n\n';
    })
  ).join('');
}
