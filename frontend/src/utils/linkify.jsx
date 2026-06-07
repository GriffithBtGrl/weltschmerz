const URL_REGEX = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g;

const linkify = (text) => {
  if (!text) return null;
  const parts = text.split(URL_REGEX);
  return parts.map((part, i) => {
    if (URL_REGEX.test(part)) {
      URL_REGEX.lastIndex = 0;
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-neon-blue hover:text-neon-blue/70 underline transition-colors break-all"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

export default linkify;