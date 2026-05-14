import { parseString } from 'xml2js';

const RSS_URL = 'https://feeds.acast.com/public/shows/671803cee16fb75ed5738f9b';

export async function fetchPodcastEpisodes() {
  try {
    const response = await fetch(RSS_URL);
    const xml = await response.text();
    
    return new Promise((resolve, reject) => {
      parseString(xml, { explicitArray: false }, (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        
        const channel = result.rss.channel;
        const items = Array.isArray(channel.item) ? channel.item : [channel.item];
        
        const episodes = items.map((item, index) => {
          const description = item.description || item['itunes:summary'] || '';
          const cleanDescription = description
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .trim();
          
          return {
            id: item.guid || item['acast:episodeId'] || `episode-${index}`,
            title: item.title || item['itunes:title'] || '',
            description: cleanDescription,
            fullDescription: description,
            duration: item['itunes:duration'] || '',
            pubDate: item.pubDate || '',
            audioUrl: item.enclosure?.$.url || item.enclosure?.url || '',
            season: item['itunes:season'] || '',
            episode: item['itunes:episode'] || '',
            image: item['itunes:image']?.href || channel['itunes:image']?.href || '',
          };
        });
        
        resolve(episodes);
      });
    });
  } catch (error) {
    console.error('Error fetching RSS feed:', error);
    return [];
  }
}

export function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('el-GR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

export function formatDuration(duration) {
  if (!duration) return '';
  if (duration.includes(':')) return duration;
  
  const parts = duration.split(':');
  if (parts.length === 3) {
    return `${parts[0]}:${parts[1]}:${parts[2]}`;
  } else if (parts.length === 2) {
    return `${parts[0]}:${parts[1]}`;
  }
  return duration;
}