import { useEffect, useRef } from 'react';

export function Comments(): JSX.Element {
  const commentsRef = useRef(null);
  useEffect(() => {
    const script = document.createElement('script');
    script.setAttribute('src', 'https://utteranc.es/client.js');
    script.setAttribute('repo', 'iigorcunha/rocket-blog-challenge');
    script.setAttribute('issue-term', 'pathname');
    script.setAttribute('theme', 'github-dark');
    script.setAttribute('crossorigin', 'anonymous');
    script.setAttribute('async', 'true');
    commentsRef.current.appendChild(script);
  }, []);

  return (
    <div style={{ width: '100%' }} id="comments">
      <div ref={commentsRef} />
    </div>
  );
}
