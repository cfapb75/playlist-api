export default async function handler(req, res) {
  const artist = req.query.artist;

  if (!artist) {
    return res.status(400).json({
      error: "Parâmetro 'artist' é obrigatório"
    });
  }

  const token = process.env.DISCOGS_TOKEN;

  if (!token) {
    return res.status(500).json({
      error: "Token do Discogs não configurado"
    });
  }

  try {
    // 1. Buscar discografia base
    const discographyUrl = `https://${req.headers.host}/api/discography?artist=${encodeURIComponent(
      artist
    )}`;

    const discographyResponse = await fetch(discographyUrl);
    const discographyData = await discographyResponse.json();

    if (!discographyData.albums || discographyData.albums.length === 0) {
      return res.status(404).json({
        artist,
        albums: [],
        message: "Nenhum álbum encontrado"
      });
    }

    // 2. Limitar a 5 álbuns (cronológicos)
    const albumsLimited = discographyData.albums;

    const albumsWithTracks = [];

    // 3. Para cada álbum, buscar tracklist
    for (const album of albumsLimited) {
      const tracksUrl = `https://${req.headers.host}/api/album-tracks?master_id=${album.id}`;
      const tracksResponse = await fetch(tracksUrl);
      const tracksData = await tracksResponse.json();

      albumsWithTracks.push({
        id: album.id,
        title: album.title,
        year: album.year,
        tracks: tracksData.tracks || []
      });
    }

    res.status(200).json({
      artist,
      albums: albumsWithTracks
    });
  } catch (error) {
    res.status(500).json({
      error: "Erro ao montar discografia completa",
      details: error.message
    });
  }
}
