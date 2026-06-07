const getMusicEmbed = (url) => {
  if (!url) return null;

  // Spotify
  const spotifyMatch = url.match(/spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/);
  if (spotifyMatch) {
    const type = spotifyMatch[1];
    const id = spotifyMatch[2];
    return {
      type: 'spotify',
      embedUrl: `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`,
    };
  }

  // YouTube
  const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (youtubeMatch) {
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${youtubeMatch[1]}`,
    };
  }

  return null;
};

const MusicEmbed = ({ url }) => {
  const embed = getMusicEmbed(url);
  if (!embed) return null;

  if (embed.type === 'spotify') {
    return (
      <iframe
        src={embed.embedUrl}
        width="100%"
        height="80"
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        className="rounded-lg"
      />
    );
  }

  if (embed.type === 'youtube') {
    return (
      <iframe
        src={embed.embedUrl}
        width="100%"
        height="200"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
        className="rounded-lg"
      />
    );
  }

  return null;
};

export default MusicEmbed;